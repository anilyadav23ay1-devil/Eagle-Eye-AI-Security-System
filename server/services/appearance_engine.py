import cv2
import numpy as np
import time
from datetime import datetime
from typing import List, Dict, Tuple, Optional, Any
from database.db import db_manager
from models.schemas import AppearanceSnapshot
from services.media_storage import media_storage

class WardrobeAppearanceEngine:
    def __init__(self):
        self.color_names = [
            ("Black / Dark Suit", (0, 0, 0), (180, 255, 60)),
            ("White / Light Formal", (0, 0, 180), (180, 40, 255)),
            ("Navy Blue Jacket", (100, 60, 50), (135, 255, 255)),
            ("Emerald / Olive Green", (35, 50, 50), (85, 255, 255)),
            ("Crimson / Red Top", (0, 70, 50), (15, 255, 255)),
            ("Amber / Gold Shirt", (16, 80, 70), (34, 255, 255)),
            ("Charcoal Gray Attire", (0, 0, 60), (180, 45, 175)),
        ]

    def analyze_wardrobe(self, torso_crop: np.ndarray, person_id: str, person_name: str = "") -> Dict[str, Any]:
        """Analyzes torso clothing crop and returns color tags and formatted description."""
        if torso_crop is None or torso_crop.size == 0:
            return {
                "dominant_colors": ["Corporate Standard"],
                "description": "Standard Corporate Attire",
                "photo_url": "",
                "is_today": True
            }

        try:
            hsv = cv2.cvtColor(torso_crop, cv2.COLOR_BGR2HSV)
            h, w = hsv.shape[:2]
            
            # Subsample center of torso
            center = hsv[int(h * 0.2):int(h * 0.8), int(w * 0.2):int(w * 0.8)]
            avg_h = np.median(center[:, :, 0])
            avg_s = np.median(center[:, :, 1])
            avg_v = np.median(center[:, :, 2])

            detected_label = "Casual Attire"
            if avg_v < 60:
                detected_label = "Black Formal Suit"
            elif avg_s < 35 and avg_v > 180:
                detected_label = "White / Light Button-Down"
            elif 95 <= avg_h <= 130:
                detected_label = "Navy Blue Corporate Jacket"
            elif 35 <= avg_h <= 85:
                detected_label = "Olive / Green Casual Top"
            elif avg_h <= 15 or avg_h >= 165:
                detected_label = "Red / Crimson Attire"
            elif 16 <= avg_h <= 34:
                detected_label = "Mustard / Gold Shirt"
            else:
                detected_label = "Charcoal Gray Business Attire"

            # Save snapshot to permanent storage
            ret, buf = cv2.imencode('.jpg', torso_crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
            photo_url = ""
            if ret:
                photo_url = media_storage.save_face_crop(buf.tobytes(), person_id)

            today_str = datetime.now().strftime("%d %b %Y")
            time_str = datetime.now().strftime("%I:%M %p")

            # Persist to database
            snapshot = AppearanceSnapshot(
                id=f"app-{person_id.lower()}-{int(time.time())}",
                person_id=person_id,
                date=today_str,
                time=time_str,
                photo_url=photo_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
                outfit_description=detected_label,
                is_today=True
            )

            conn = db_manager.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO appearance_snapshots (id, person_id, date, time, photo_url, outfit_description, is_today)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            ''', (snapshot.id, snapshot.person_id, snapshot.date, snapshot.time, snapshot.photo_url, snapshot.outfit_description))
            conn.commit()
            conn.close()

            return {
                "dominant_colors": [detected_label.split(" ")[0]],
                "description": detected_label,
                "photo_url": photo_url,
                "date": today_str,
                "time": time_str
            }
        except Exception:
            return {
                "dominant_colors": ["Corporate Standard"],
                "description": "Standard Corporate Attire",
                "photo_url": "",
                "is_today": True
            }

appearance_engine = WardrobeAppearanceEngine()
