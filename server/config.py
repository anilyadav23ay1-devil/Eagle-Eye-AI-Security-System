import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Eagle Eye - AI Security Platform"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Database Settings (Local SQLite by default; seamlessly connects to PostgreSQL/Supabase via DATABASE_URL)
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'eagle_eye.db'}"
    
    # Media & Asset Storage
    STORAGE_BACKEND: str = "local"  # "local" | "s3"
    MEDIA_DIR: Path = BASE_DIR / "data" / "media"
    
    # Cloud Object Storage (DigitalOcean Spaces / AWS S3 / Azure Blob)
    S3_ENDPOINT_URL: str = ""
    S3_BUCKET: str = "eagle-eye-vault"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "us-east-1"
    
    # JWT Authentication & RBAC Security
    JWT_SECRET_KEY: str = "eagle-eye-super-secret-production-jwt-key-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8 hours
    
    # CORS Origins
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure media storage directories exist
(settings.MEDIA_DIR / "face_crops").mkdir(parents=True, exist_ok=True)
(settings.MEDIA_DIR / "blueprints").mkdir(parents=True, exist_ok=True)
(settings.MEDIA_DIR / "snapshots").mkdir(parents=True, exist_ok=True)
