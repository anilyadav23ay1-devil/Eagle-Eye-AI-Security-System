import cv2
import numpy as np
import time
import math
from datetime import datetime
from typing import List, Dict, Tuple, Optional, Any
from models.schemas import RoomZone, Point2D

class DetectedObject:
    def __init__(self, track_id: str, bbox: Tuple[int, int, int, int], confidence: float, class_name: str = "person"):
        self.track_id = track_id
        self.bbox = bbox  # x1, y1, x2, y2
        self.confidence = confidence
        self.class_name = class_name
        self.matched_person_id: Optional[str] = None
        self.matched_name: Optional[str] = None
        self.is_authorized: bool = True
        self.face_crop: Optional[np.ndarray] = None
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
        # 1. Background Subtractor for high-precision real-time motion & person silhouette extraction
        self.bg_subtractors: Dict[str, Any] = {}

        # 2. Multi-Camera Centroid Trackers
        self.trackers: Dict[str, CentroidTracker] = {}
        self.tracked_objects: Dict[str, Dict[str, DetectedObject]] = {}

    def process_frame(self, camera_id: str, frame: np.ndarray, rooms_on_floor: List[RoomZone] = None) -> Tuple[np.ndarray, List[DetectedObject]]:
        """Processes real video frame: Optical motion detection, bounding box extraction, spatial room mapping, and HUD overlay."""
        if frame is None or frame.size == 0:
            return frame, []

        h, w = frame.shape[:2]
        detected_rects = []
        confidences = []

        # Initialize background subtractor per camera stream
        if camera_id not in self.bg_subtractors:
            self.bg_subtractors[camera_id] = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=25, detectShadows=True)

        bg_sub = self.bg_subtractors[camera_id]
        fg_mask = bg_sub.apply(frame)

        # Morphological filtering to remove optical sensor noise and fill body silhouettes
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        fg_mask = cv2.dilate(fg_mask, kernel, iterations=2)

        # Find contours representing human body silhouettes
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter out tiny noise and gigantic full-screen changes
            if 1500 < area < (w * h * 0.75):
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = bh / float(bw)
                # Typical human standing/walking aspect ratio >= 1.0 or significant body area
                if aspect_ratio >= 0.8 or area > 3500:
                    x1 = max(0, x - 10)
                    y1 = max(0, y - 10)
                    x2 = min(w, x + bw + 10)
                    y2 = min(h, y + bh + 10)
                    detected_rects.append((x1, y1, x2, y2))
                    conf = min(0.96, max(0.65, area / 15000.0 + 0.6))
                    confidences.append(conf)

        # Update multi-object tracker
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
                    best_track_id = f"TRK-{tid:04d}"

            if not best_track_id:
                best_track_id = f"TRK-{abs(hash((cx, cy, time.time()))) % 10000:04d}"

            conf = confidences[i] if i < len(confidences) else 0.88
            obj = DetectedObject(track_id=best_track_id, bbox=rect, confidence=conf)

            # Analyze Torso Clothing Color
            person_crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
            if person_crop.size > 0:
                obj.dominant_colors = self._extract_clothing_color(person_crop)
                obj.matched_name = f"Subject #{best_track_id}"
                obj.is_authorized = True

            # Map pixel position to room zones
            if rooms_on_floor:
                norm_x = (cx / w) * 100
                norm_y = (cy / h) * 100
                for r in rooms_on_floor:
                    if r.x <= norm_x <= (r.x + r.width) and r.y <= norm_y <= (r.y + r.height):
                        obj.current_zone = r.name
                        break

            current_detected_objects.append(obj)
            self.tracked_objects[camera_id][best_track_id] = obj

        # Render Cyber HUD Annotations
        annotated_frame = self._render_hud_overlays(frame.copy(), current_detected_objects)

        return annotated_frame, current_detected_objects

    def _extract_clothing_color(self, person_crop: np.ndarray) -> List[str]:
        """Extracts dominant clothing colors from the torso area."""
        h, w = person_crop.shape[:2]
        torso = person_crop[int(h * 0.25):int(h * 0.75), :]
        if torso.size == 0:
            return ["Dark Attire"]

        hsv = cv2.cvtColor(torso, cv2.COLOR_BGR2HSV)
        avg_h = np.mean(hsv[:, :, 0])
        avg_s = np.mean(hsv[:, :, 1])
        avg_v = np.mean(hsv[:, :, 2])

        if avg_v < 60:
            return ["Black / Dark Formal"]
        elif avg_s < 40 and avg_v > 180:
            return ["White / Light Formal"]
        elif 90 <= avg_h <= 130:
            return ["Blue / Navy Jacket"]
        elif 35 <= avg_h <= 85:
            return ["Green / Olive"]
        elif 0 <= avg_h <= 20:
            return ["Red / Orange"]
        return ["Casual Attire"]

    def _render_hud_overlays(self, frame: np.ndarray, detections: List[DetectedObject]) -> np.ndarray:
        """Draws neon HUD bounding boxes, target tokens, and AI confidence badges."""
        for obj in detections:
            x1, y1, x2, y2 = obj.bbox
            is_alert = not obj.is_authorized
            color = (0, 0, 255) if is_alert else (0, 235, 255)
            thickness = 2

            # Corner brackets
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
            badge_text = f"{obj.matched_name or obj.track_id} [{int(obj.confidence * 100)}%]"
            cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + len(badge_text) * 9 + 10, y1), (15, 23, 42), -1)
            cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + len(badge_text) * 9 + 10, y1), color, 1)
            cv2.putText(frame, badge_text, (x1 + 5, y1 - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

            # Bottom Zone & Attire Pill
            bottom_text = f"{obj.dominant_colors[0] if obj.dominant_colors else 'Standard'} | {obj.current_zone or 'Zone A'}"
            cv2.rectangle(frame, (x1, y2), (x1 + len(bottom_text) * 7 + 8, y2 + 18), (15, 23, 42), -1)
            cv2.putText(frame, bottom_text, (x1 + 4, y2 + 13), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1)

        # AI Watermark
        cv2.putText(frame, f"EAGLE EYE AI CORE :: {len(detections)} TARGETS TRACKED", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 200), 1)
        return frame

ai_vision_engine = AIVisionEngine()
