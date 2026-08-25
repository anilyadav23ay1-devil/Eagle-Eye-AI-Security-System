from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class PersonRole(str, Enum):
    EMPLOYEE = "Employee"
    VISITOR = "Visitor"
    CONTRACTOR = "Contractor"
    VIP = "VIP"
    VENDOR = "Vendor"
    SECURITY = "Security"

class AccessStatus(str, Enum):
    AUTHORIZED = "Authorized"
    TEMPORARY = "Temporary"
    EXPIRED = "Expired"
    RESTRICTED = "Restricted"
    UNKNOWN = "Unknown"
    ALERT = "Alert"

class AlertSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class AlertType(str, Enum):
    UNAUTHORIZED_ACCESS = "Unauthorized Access"
    TAILGATING = "Tailgating Detected"
    RESTRICTED_ZONE = "Restricted Area Access"
    UNKNOWN_PERSON = "Unknown Person Detected"
    LOITERING = "Loitering Detected"
    EXPIRED_PERMISSION = "Permission Expired"

class AlertStatus(str, Enum):
    ACTIVE = "Active"
    INVESTIGATING = "Investigating"
    RESOLVED = "Resolved"
    FALSE_ALARM = "False Alarm"

class AppearanceSnapshot(BaseModel):
    id: str
    person_id: str
    date: str
    time: str
    photo_url: str
    outfit_description: str
    is_today: bool = False

class MovementEvent(BaseModel):
    id: str
    person_id: str
    track_id: str
    timestamp: str
    camera_id: str
    building: str
    floor: str
    room: str
    event_type: str = "ENTER"  # ENTER, TRANSIT, EXIT, ALERT
    dwell_time_seconds: int = 0

class Person(BaseModel):
    id: str
    person_id: str
    track_id: str
    name: str
    mobile: str
    email: str
    id_proof_type: str = "Aadhaar Card"
    id_proof_number: str
    role: PersonRole = PersonRole.VISITOR
    permission_type: str = "Temporary"  # Temporary or Permanent
    valid_from: str
    valid_to: str
    allowed_zones: List[str] = Field(default_factory=list)
    photo_url: str
    today_appearance_url: str
    status: AccessStatus = AccessStatus.AUTHORIZED
    notes: Optional[str] = ""
    current_building: str = "Corporate Tower A"
    current_floor: str = "Floor 2"
    current_room: str = "Meeting Room"
    current_camera_id: str = "CAM-021"
    last_seen_time: str
    x_pos: float = 50.0
    y_pos: float = 50.0
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class Camera(BaseModel):
    id: str
    camera_id: str
    name: str
    building: str
    floor: str
    room: str
    status: str = "Online"  # Online, Degraded, Offline
    fps: int = 30
    resolution: str = "4K UHD (3840x2160)"
    latency_ms: int = 18
    ai_models: List[str] = Field(default_factory=lambda: ["YOLOv8", "DeepFace", "ByteTrack"])
    fov_angle: int = 90
    x_pos: float
    y_pos: float

class RoomZone(BaseModel):
    id: str
    name: str
    building: str
    floor: str
    max_capacity: int
    current_occupancy: int = 0
    is_restricted: bool = False
    allowed_roles: List[str] = Field(default_factory=list)
    occupants: List[str] = Field(default_factory=list)  # list of person_ids
    x: float
    y: float
    width: float
    height: float

class SecurityAlert(BaseModel):
    id: str
    alert_id: str
    timestamp: str
    severity: AlertSeverity
    type: AlertType
    title: str
    description: str
    building: str
    floor: str
    room: str
    camera_id: str
    person_id: Optional[str] = None
    track_id: Optional[str] = None
    person_name: Optional[str] = None
    person_photo: Optional[str] = None
    status: AlertStatus = AlertStatus.ACTIVE
    guard_notes: Optional[str] = ""

class SecurityRule(BaseModel):
    id: str
    name: str
    type: AlertType
    description: str
    is_enabled: bool = True
    zone_id: Optional[str] = None
    threshold_seconds: Optional[int] = 0
    severity: AlertSeverity = AlertSeverity.HIGH

class PersonEnrollmentRequest(BaseModel):
    name: str
    mobile: str
    email: str
    id_proof_type: str = "Aadhaar Card"
    id_proof_number: str
    role: PersonRole = PersonRole.VISITOR
    permission_type: str = "Temporary"
    valid_from: str
    valid_to: str
    allowed_zones: List[str]
    photo_url: Optional[str] = None
    notes: Optional[str] = ""
    temporary_track_id: Optional[str] = None

class BuildingStats(BaseModel):
    total_in_building: int
    authorized: int
    unknown: int
    alerts: int
    cameras_online: int
    total_cameras: int
    entries_today: int
    exits_today: int
    floor_occupancies: Dict[str, int]
