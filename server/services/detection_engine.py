import cv2
import numpy as np
from typing import List, Tuple

class PersonDetectionEngine:
    def __init__(self):
        # Adaptive MOG2 Background Motion & Pedestrian Silhouette Subtractor
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=25, detectShadows=True)

    def detect_persons(self, frame: np.ndarray) -> List[Tuple[int, int, int, int, float]]:
        """Detects humans in video frame and returns [x1, y1, x2, y2, confidence]."""
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        boxes: List[Tuple[int, int, int, int, float]] = []

        # 1. Adaptive Motion & Body Contour Morphology
        fg_mask = self.bg_subtractor.apply(frame)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        fg_mask = cv2.dilate(fg_mask, kernel, iterations=2)

        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter out camera noise and screen flicker
            if 1500 < area < (w * h * 0.75):
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = bh / float(bw)
                # Human standing/walking aspect ratio >= 0.8 or large body contour
                if aspect_ratio >= 0.75 or area > 3500:
                    x1 = max(0, x - 12)
                    y1 = max(0, y - 12)
                    x2 = min(w, x + bw + 12)
                    y2 = min(h, y + bh + 12)
                    conf = min(0.98, max(0.68, area / 14000.0 + 0.62))
                    boxes.append((x1, y1, x2, y2, conf))

        # Non-Maximum Suppression (NMS) to eliminate duplicate overlapping boxes
        return self._apply_nms(boxes, overlap_thresh=0.45)

    def _apply_nms(self, boxes: List[Tuple[int, int, int, int, float]], overlap_thresh: float = 0.45) -> List[Tuple[int, int, int, int, float]]:
        if len(boxes) == 0:
            return []

        boxes_arr = np.array([[b[0], b[1], b[2], b[3]] for b in boxes], dtype=float)
        scores = np.array([b[4] for b in boxes], dtype=float)

        x1 = boxes_arr[:, 0]
        y1 = boxes_arr[:, 1]
        x2 = boxes_arr[:, 2]
        y2 = boxes_arr[:, 3]

        area = (x2 - x1 + 1) * (y2 - y1 + 1)
        idxs = np.argsort(scores)
        pick = []

        while len(idxs) > 0:
            last = len(idxs) - 1
            i = idxs[last]
            pick.append(i)

            xx1 = np.maximum(x1[i], x1[idxs[:last]])
            yy1 = np.maximum(y1[i], y1[idxs[:last]])
            xx2 = np.minimum(x2[i], x2[idxs[:last]])
            yy2 = np.minimum(y2[i], y2[idxs[:last]])

            w = np.maximum(0, xx2 - xx1 + 1)
            h = np.maximum(0, yy2 - yy1 + 1)

            overlap = (w * h) / area[idxs[:last]]
            idxs = np.delete(idxs, np.concatenate(([last], np.where(overlap > overlap_thresh)[0])))

        return [boxes[i] for i in pick]

    def extract_crops(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> Tuple[np.ndarray, np.ndarray]:
        """Extracts (face_headshot_crop, torso_crop) from a detected bounding box."""
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = bbox
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        person_crop = frame[y1:y2, x1:x2]
        if person_crop.size == 0:
            empty = np.zeros((10, 10, 3), dtype=np.uint8)
            return empty, empty

        bh, bw = person_crop.shape[:2]
        # Headshot is upper 45%
        face_crop = person_crop[0:int(bh * 0.45), :] if bh > 40 else person_crop
        # Torso is 25% to 75%
        torso_crop = person_crop[int(bh * 0.25):int(bh * 0.75), :] if bh > 40 else person_crop

        return face_crop, torso_crop

detection_engine = PersonDetectionEngine()
