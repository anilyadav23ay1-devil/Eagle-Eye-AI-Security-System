import os
import time
import base64
import re
from pathlib import Path
from typing import Optional
from config import settings

class MediaStorageService:
    def __init__(self):
        self.media_dir = settings.MEDIA_DIR
        self.backend = settings.STORAGE_BACKEND

    def save_face_crop(self, image_data: str | bytes, person_id: str) -> str:
        """Saves a captured face image and returns a permanent web-accessible URL."""
        filename = f"{person_id.lower().replace('-', '_')}_{int(time.time())}.jpg"
        target_path = self.media_dir / "face_crops" / filename

        try:
            if isinstance(image_data, str):
                if image_data.startswith("data:image"):
                    # Strip base64 metadata header
                    image_data = re.sub(r"^data:image/.+;base64,", "", image_data)
                raw_bytes = base64.b64decode(image_data)
            else:
                raw_bytes = image_data

            with open(target_path, "wb") as f:
                f.write(raw_bytes)

            return f"/media/face_crops/{filename}"
        except Exception as e:
            # Fallback to input string if decoding fails
            return str(image_data)

    def save_blueprint_file(self, file_bytes: bytes, building_id: str, floor_id: str, ext: str = "png") -> str:
        """Saves an architectural blueprint PDF or Image."""
        clean_bldg = re.sub(r'[^a-zA-Z0-9_-]', '_', building_id).lower()
        clean_floor = re.sub(r'[^a-zA-Z0-9_-]', '_', floor_id).lower()
        clean_ext = ext.strip('.').lower() or "png"
        filename = f"{clean_bldg}_{clean_floor}_{int(time.time())}.{clean_ext}"
        target_path = self.media_dir / "blueprints" / filename

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        return f"/media/blueprints/{filename}"

    def save_incident_snapshot(self, file_bytes: bytes, alert_id: str) -> str:
        """Saves a security incident screenshot."""
        clean_alert = re.sub(r'[^a-zA-Z0-9_-]', '_', alert_id).lower()
        filename = f"{clean_alert}_{int(time.time())}.jpg"
        target_path = self.media_dir / "snapshots" / filename

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        return f"/media/snapshots/{filename}"

media_storage = MediaStorageService()
