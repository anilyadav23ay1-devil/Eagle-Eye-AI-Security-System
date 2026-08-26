import cv2
import numpy as np
from typing import List, Tuple

def enhance_image_clarity(img: np.ndarray) -> np.ndarray:
    """Enhances photo clarity, sharpness, and balanced illumination using LAB CLAHE."""
    if img is None or img.size == 0:
        return img
    try:
        # 1. Convert to LAB color space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # 2. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L-channel
        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        
        # 3. Merge back and convert to BGR
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        # 4. Subtle unsharp mask for crisp facial feature definition
        gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
        sharpened = cv2.addWeighted(enhanced, 1.25, gaussian, -0.25, 0)
        return sharpened
    except Exception:
        return img

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
                # Human standing/walking aspect ratio >= 0.75 or large body contour
                if aspect_ratio >= 0.75 or area > 3500:
                    x1 = max(0, x - 15)
                    y1 = max(0, y - 15)
                    x2 = min(w, x + bw + 15)
                    y2 = min(h, y + bh + 15)
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
        """
        Extracts high-clarity, complete face & portrait crops with generous headroom,
        shoulder margins, and illumination enhancement.
        """
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = bbox
        
        bw = x2 - x1
        bh = y2 - y1

        # 1. Complete Head & Shoulder Portrait Framing (Upper 55% with headroom and side margin)
        hs_top = max(0, y1 - int(bh * 0.15))
        hs_bottom = min(h, y1 + int(bh * 0.60))
        hs_left = max(0, x1 - int(bw * 0.18))
        hs_right = min(w, x2 + int(bw * 0.18))

        headshot_raw = frame[hs_top:hs_bottom, hs_left:hs_right]
        if headshot_raw.size == 0 or headshot_raw.shape[0] < 20 or headshot_raw.shape[1] < 20:
            headshot_raw = frame[y1:y2, x1:x2]

        headshot_crop = enhance_image_clarity(headshot_raw)

        # 2. Torso Crop (for clothing analysis)
        t_top = min(h, y1 + int(bh * 0.25))
        t_bottom = min(h, y1 + int(bh * 0.78))
        torso_raw = frame[t_top:t_bottom, x1:x2]
        if torso_raw.size == 0:
            torso_raw = headshot_crop
        torso_crop = enhance_image_clarity(torso_raw)

        return headshot_crop, torso_crop

detection_engine = PersonDetectionEngine()
