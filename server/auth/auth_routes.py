from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from database.db import db_manager
from auth.security import verify_password, get_password_hash, create_access_token, decode_access_token
from config import settings

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])
security_bearer = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: dict

class RegisterUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "Guard"  # "Admin" | "Supervisor" | "Guard"
    full_name: Optional[str] = None

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> dict:
    """Dependency to extract and validate the authenticated user from the Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db_manager.get_user_by_id(payload["sub"])
    if not user or not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found.",
        )
    
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Requires the logged in user to have the Admin role."""
    if user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this action.",
        )
    return user

@auth_router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request):
    user = db_manager.get_user_by_username(req.username.strip())
    if not user or not verify_password(req.password, user["password_hash"]):
        db_manager.log_audit(
            action="LOGIN_FAILED",
            entity_type="AUTH",
            details={"username": req.username},
            ip_address=request.client.host if request.client else "127.0.0.1"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    access_token = create_access_token(
        data={"sub": user["id"], "username": user["username"], "role": user["role"]},
        expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    )

    user_info = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"]
    }

    db_manager.log_audit(
        user_id=user["id"],
        action="LOGIN_SUCCESS",
        entity_type="AUTH",
        entity_id=user["id"],
        details={"role": user["role"]},
        ip_address=request.client.host if request.client else "127.0.0.1"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.JWT_EXPIRE_MINUTES,
        user=user_info
    )

@auth_router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "full_name": current_user["full_name"],
        "created_at": current_user["created_at"]
    }

@auth_router.post("/register")
async def register_user(req: RegisterUserRequest, request: Request, current_user: dict = Depends(get_current_user)):
    # Check if username or email exists
    existing = db_manager.get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already in use.")

    pwd_hash = get_password_hash(req.password)
    new_user = db_manager.create_user({
        "username": req.username,
        "email": str(req.email),
        "password_hash": pwd_hash,
        "role": req.role,
        "full_name": req.full_name or req.username
    })

    db_manager.log_audit(
        user_id=current_user["id"],
        action="USER_CREATED",
        entity_type="USER",
        entity_id=new_user["id"],
        details={"username": new_user["username"], "role": new_user["role"]},
        ip_address=request.client.host if request.client else "127.0.0.1"
    )

    return {
        "success": True,
        "message": f"User {new_user['username']} created successfully.",
        "user": {
            "id": new_user["id"],
            "username": new_user["username"],
            "email": new_user["email"],
            "role": new_user["role"],
            "full_name": new_user["full_name"]
        }
    }

@auth_router.get("/users")
async def list_all_users(current_user: dict = Depends(get_current_user)):
    return db_manager.list_users()

@auth_router.get("/audit-logs")
async def get_audit_logs(limit: int = 100, current_user: dict = Depends(get_current_user)):
    return db_manager.get_audit_logs(limit=limit)
