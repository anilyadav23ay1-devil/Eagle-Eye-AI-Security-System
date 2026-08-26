import cv2
import numpy as np
import time
import math
import base64
from typing import List, Dict, Tuple, Optional, Any
from models.schemas import RoomZone, Point2D
from services.detection_engine import detection_engine
from services.face_recognition_service import face_service

def frame_crop_to_base64(crop: np.ndarray, target_size: int = 512) -> str:
    """Converts optical image crop to crystal-clear high-definition Base64 JPEG Data URL."""
    if crop is None or crop.size == 0:
        return ""
    try:
        h, w = crop.shape[:2]
        if w > 0 and h > 0:
            # Maintain high resolution with cubic interpolation
            scale = target_size / max(h, w)
            new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
            resized = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
            ret, buf = cv2.imencode('.jpg', resized, [cv2.IMWRITE_JPEG_QUALITY, 95])
            if ret:
                return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode('utf-8')
    except Exception:
        pass
    return ""

class DetectedObject:
    def __init__(self, track_id: str, bbox: Tuple[int, int, int, int], confidence: float, class_name: str = "person"):
        self.track_id = track_id
        self.bbox = bbox  # x1, y1, x2, y2
        self.confidence = confidence
        self.class_name = class_name
        self.matched_person_id: Optional[str] = None
        self.matched_name: Optional[str] = None
        self.role: str = "Unknown"
        self.is_authorized: bool = False
        self.face_crop: Optional[np.ndarray] = None
        self.photo_base64: str = ""
        self.dominant_colors: List[str] = []
        self.current_zone: Optional[str] = None
        self.zone_entry_time: float = time.time()
        self.centroid: Tuple[int, int] = (
            int((bbox[0] + bbox[2]) / 2),
            int((bbox[1] + bbox[3]) / 2)
        )

class CentroidTracker:
    def __init__(self, max_disappeared: int = 30, max_distance: int = 80):
        self.next_track_id = 1001
        self.objects: Dict[int, Tuple[int, int]] = {}
        self.disappeared: Dict[int, int] = {}
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance

    def register(self, centroid: Tuple[int, int]) -> int:
        track_id = self.next_track_id
        self.objects[track_id] = centroid
        self.disappeared[track_id] = 0
        self.next_track_id += 1
        return track_id

    def deregister(self, track_id: int):
        if track_id in self.objects:
            del self.objects[track_id]
        if track_id in self.disappeared:
            del self.disappeared[track_id]

    def update(self, rects: List[Tuple[int, int, int, int]]) -> Dict[int, Tuple[int, int]]:
        if len(rects) == 0:
            for track_id in list(self.disappeared.keys()):
                self.disappeared[track_id] += 1
                if self.disappeared[track_id] > self.max_disappeared:
                    self.deregister(track_id)
            return self.objects

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (startX, startY, endX, endY)) in enumerate(rects):
            cX = int((startX + endX) / 2.0)
            cY = int((startY + endY) / 2.0)
            input_centroids[i] = (cX, cY)

        if len(self.objects) == 0:
            for i in range(len(input_centroids)):
                self.register(tuple(input_centroids[i]))
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())

            D = np.zeros((len(object_centroids), len(input_centroids)))
            for i in range(len(object_centroids)):
                for j in range(len(input_centroids)):
                    D[i, j] = np.linalg.norm(np.array(object_centroids[i]) - input_centroids[j])

            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue
                if D[row, col] > self.max_distance:
                    continue

                object_id = object_ids[row]
                self.objects[object_id] = tuple(input_centroids[col])
                self.disappeared[object_id] = 0

                used_rows.add(row)
                used_cols.add(col)

            unused_rows = set(range(0, D.shape[0])).difference(used_rows)
            unused_cols = set(range(0, D.shape[1])).difference(used_cols)

            for row in unused_rows:
                object_id = object_ids[row]
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)

            for col in unused_cols:
                self.register(tuple(input_centroids[col]))

        return self.objects


class AIVisionEngine:
    def __init__(self):
        self.trackers: Dict[str, CentroidTracker] = {}
        self.tracked_objects: Dict[str, Dict[str, DetectedObject]] = {}

    def process_frame(
        self,
        camera_id: str,
        frame: np.ndarray,
        rooms_on_floor: List[RoomZone] = None,
        persons_db: Dict[str, Any] = None
    ) -> Tuple[np.ndarray, List[DetectedObject]]:
        """Executes full Phase 2 deep AI pipeline: Detection, Centroid Tracking, ArcFace Biometrics, and HUD Rendering."""
        if frame is None or frame.size == 0:
            return frame, []

        h, w = frame.shape[:2]

        # 1. Run Person Detection
        raw_detections = detection_engine.detect_persons(frame)
        detected_rects = [(b[0], b[1], b[2], b[3]) for b in raw_detections]
        confidences = [b[4] for b in raw_detections]

        if camera_id not in self.trackers:
            self.trackers[camera_id] = CentroidTracker()
            self.tracked_objects[camera_id] = {}

        tracker = self.trackers[camera_id]
        active_centroids = tracker.update(detected_rects)

        current_detected_objects: List[DetectedObject] = []

        for i, rect in enumerate(detected_rects):
            x1, y1, x2, y2 = rect
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)

            best_track_id = None
            min_dist = float('inf')
            for tid, cent in active_centroids.items():
                d = math.hypot(cent[0] - cx, cent[1] - cy)
                if d < min_dist and d < 80:
                    min_dist = d
                    best_track_id = f"TRK-2025-{tid:04d}"

            if not best_track_id:
                best_track_id = f"TRK-2025-{abs(hash((cx, cy, time.time()))) % 10000:04d}"

            conf = confidences[i] if i < len(confidences) else 0.88
            obj = DetectedObject(track_id=best_track_id, bbox=rect, confidence=conf)

            # 2. Extract crops
            face_crop, torso_crop = detection_engine.extract_crops(frame, rect)
            obj.face_crop = face_crop
            obj.photo_base64 = frame_crop_to_base64(face_crop)
            obj.dominant_colors = self._extract_clothing_color(torso_crop)

            # 3. ArcFace Biometric Recognition Matching
            if persons_db:
                match_result = face_service.match_face(face_crop, persons_db)
                if match_result["is_match"]:
                    obj.matched_person_id = match_result["person_id"]
                    obj.matched_name = match_result["name"]
                    obj.role = match_result["role"]
                    obj.is_authorized = True
                    obj.confidence = max(conf, match_result["confidence"])
                else:
                    obj.matched_name = f"Unknown Subject [{best_track_id}]"
                    obj.role = "Unknown"
                    obj.is_authorized = False
            else:
                obj.matched_name = f"Tracked Person [{best_track_id}]"
                obj.role = "Visitor"
                obj.is_authorized = True

            # 4. Map spatial coordinate to room zones
            if rooms_on_floor:
                norm_x = (cx / w) * 100
                norm_y = (cy / h) * 100
                for r in rooms_on_floor:
                    if r.x <= norm_x <= (r.x + r.width) and r.y <= norm_y <= (r.y + r.height):
                        obj.current_zone = r.name
                        break

            current_detected_objects.append(obj)
            self.tracked_objects[camera_id][best_track_id] = obj

        annotated_frame = self._render_hud_overlays(frame.copy(), current_detected_objects)
        return annotated_frame, current_detected_objects

    def _extract_clothing_color(self, torso_crop: np.ndarray) -> List[str]:
        """Extracts dominant clothing colors from the torso region."""
        if torso_crop is None or torso_crop.size == 0:
            return ["Corporate Attire"]

        try:
            hsv = cv2.cvtColor(torso_crop, cv2.COLOR_BGR2HSV)
            avg_h = np.mean(hsv[:, :, 0])
            avg_s = np.mean(hsv[:, :, 1])
            avg_v = np.mean(hsv[:, :, 2])

            if avg_v < 55:
                return ["Black / Dark Suit"]
            elif avg_s < 35 and avg_v > 180:
                return ["White / Light Formal"]
            elif 90 <= avg_h <= 130:
                return ["Navy Blue Jacket"]
            elif 35 <= avg_h <= 85:
                return ["Olive / Green Attire"]
            elif 0 <= avg_h <= 20:
                return ["Red / Orange Top"]
            return ["Standard Attire"]
        except Exception:
            return ["Standard Attire"]

    def _render_hud_overlays(self, frame: np.ndarray, detections: List[DetectedObject]) -> np.ndarray:
        """Draws neon HUD bounding boxes, target tokens, and AI confidence badges."""
        for obj in detections:
            x1, y1, x2, y2 = obj.bbox
            is_auth = obj.is_authorized
            
            # Color coding: Green for Employee/Authorized, Purple for VIP/Visitor, Red for Unknown/Breach
            if not is_auth:
                color = (0, 0, 255)       # Red
            elif obj.role == "Employee":
                color = (0, 235, 120)     # Emerald Green
            elif obj.role == "VIP":
                color = (255, 120, 220)   # Neon Purple
            else:
                color = (255, 190, 0)     # Cyan / Sky

            thickness = 2

            # Neon Corner Brackets
            d = 16
            cv2.line(frame, (x1, y1), (x1 + d, y1), color, thickness)
            cv2.line(frame, (x1, y1), (x1, y1 + d), color, thickness)
            cv2.line(frame, (x2, y1), (x2 - d, y1), color, thickness)
            cv2.line(frame, (x2, y1), (x2, y1 + d), color, thickness)
            cv2.line(frame, (x1, y2), (x1 + d, y2), color, thickness)
            cv2.line(frame, (x1, y2), (x1, y2 - d), color, thickness)
            cv2.line(frame, (x2, y2), (x2 - d, y2), color, thickness)
            cv2.line(frame, (x2, y2), (x2 - d, y2), color, thickness)

            # Box fill tint
            overlay = frame.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
            cv2.addWeighted(overlay, 0.08, frame, 0.92, 0, frame)

            # Top Badge Header
            prefix = "✓ " if is_auth else "⚠ "
            badge_text = f"{prefix}{obj.matched_name} [{int(obj.confidence * 100)}%]"
            cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + len(badge_text) * 9 + 10, y1), (15, 23, 42), -1)
            cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + len(badge_text) * 9 + 10, y1), color, 1)
            cv2.putText(frame, badge_text, (x1 + 5, y1 - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (255, 255, 255), 1)

            # Bottom Zone & Attire Pill
            bottom_text = f"{obj.dominant_colors[0]} | {obj.current_zone or 'Zone A'}"
            cv2.rectangle(frame, (x1, y2), (x1 + len(bottom_text) * 7 + 8, y2 + 18), (15, 23, 42), -1)
            cv2.putText(frame, bottom_text, (x1 + 4, y2 + 13), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1)

        # AI Watermark
        cv2.putText(frame, f"EAGLE EYE AI CORE 2.0 :: {len(detections)} TARGETS ACTIVE", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 200), 1)
        return frame

ai_vision_engine = AIVisionEngine()
