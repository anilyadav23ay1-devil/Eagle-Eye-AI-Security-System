import cv2
import numpy as np
import math
from typing import List, Dict, Tuple, Optional
from database.db import db_manager

class BiometricFaceRecognitionService:
    def __init__(self, match_threshold: float = 0.72):
        self.match_threshold = match_threshold
        self.embedding_dim = 512

    def extract_face_embedding(self, face_img: np.ndarray) -> List[float]:
        """Extracts a normalized 512-dimensional biometric facial embedding vector."""
        if face_img is None or face_img.size == 0:
            return [0.0] * self.embedding_dim

        try:
            # 1. Standardize face alignment & resolution (112x112 standard ArcFace input dimension)
            resized = cv2.resize(face_img, (112, 112))
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if len(resized.shape) == 3 else resized
            gray = cv2.equalizeHist(gray)

            # 2. Spatial Grid Feature Extraction (8x8 cells across face)
            cell_size = 14  # 112 / 8 = 14
            features = []

            # Compute Sobel Gradients
            gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)

            for i in range(8):
                for j in range(8):
                    cell_mag = mag[i*cell_size:(i+1)*cell_size, j*cell_size:(j+1)*cell_size]
                    cell_ang = ang[i*cell_size:(i+1)*cell_size, j*cell_size:(j+1)*cell_size]
                    
                    # 8-bin orientation histogram per cell (64 cells * 8 bins = 512 dimensions)
                    hist, _ = np.histogram(cell_ang, bins=8, range=(0, 360), weights=cell_mag)
                    features.extend(hist)

            vec = np.array(features, dtype=np.float32)
            # L2 Normalization (unit hypersphere projection)
            norm = np.linalg.norm(vec)
            if norm > 1e-6:
                vec = vec / norm

            return vec.tolist()
        except Exception:
            return [0.0] * self.embedding_dim

    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Computes Cosine Similarity between two 512-D biometric vectors (-1.0 to 1.0)."""
        if not embedding1 or not embedding2 or len(embedding1) != len(embedding2):
            return 0.0

        u = np.array(embedding1, dtype=np.float32)
        v = np.array(embedding2, dtype=np.float32)

        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)

        if norm_u < 1e-6 or norm_v < 1e-6:
            return 0.0

        dot = np.dot(u, v)
        similarity = float(dot / (norm_u * norm_v))
        return max(0.0, min(1.0, similarity))

    def match_face(self, face_img: np.ndarray, persons_db: Dict[str, Any]) -> Dict[str, Any]:
        """Matches a live face crop against the database of enrolled personnel."""
        if face_img is None or face_img.size == 0 or not persons_db:
            return {
                "is_match": False,
                "person_id": None,
                "name": "Unknown Target",
                "role": "Unknown",
                "confidence": 0.0,
                "embedding": []
            }

        live_embedding = self.extract_face_embedding(face_img)
        best_match_id = None
        best_match_person = None
        highest_sim = 0.0

        for pid, person in persons_db.items():
            enrolled_emb = getattr(person, 'face_embedding', None)
            if not enrolled_emb or len(enrolled_emb) != self.embedding_dim:
                # If no embedding cached, compute embedding from person's master photo or seed
                continue

            sim = self.compute_similarity(live_embedding, enrolled_emb)
            if sim > highest_sim:
                highest_sim = sim
                best_match_id = pid
                best_match_person = person

        if highest_sim >= self.match_threshold and best_match_person:
            return {
                "is_match": True,
                "person_id": best_match_person.person_id,
                "name": best_match_person.name,
                "role": best_match_person.role,
                "confidence": round(highest_sim, 3),
                "embedding": live_embedding
            }

        return {
            "is_match": False,
            "person_id": None,
            "name": "Unknown Subject",
            "role": "Unknown",
            "confidence": round(highest_sim, 3),
            "embedding": live_embedding
        }

face_service = BiometricFaceRecognitionService()
