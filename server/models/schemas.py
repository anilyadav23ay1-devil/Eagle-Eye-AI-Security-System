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
    OVERCROWDING = "Overcrowding Detected"

class AlertStatus(str, Enum):
    ACTIVE = "Active"
    INVESTIGATING = "Investigating"
    RESOLVED = "Resolved"
    FALSE_ALARM = "False Alarm"

class CameraBrand(str, Enum):
    HIKVISION = "Hikvision"
    DAHUA = "Dahua"
    AXIS = "Axis"
    CP_PLUS = "CP Plus"
    REOLINK = "Reolink"
    HANWHA = "Hanwha / Samsung"
    UNIVIEW = "Uniview"
    AMCREST = "Amcrest"
    GENERIC_RTSP = "Generic RTSP"
    MOBILE_IP = "Mobile IP Cam (DroidCam/IP Webcam)"
    USB_WEBCAM = "Local USB / Built-in Webcam"
    SIMULATED = "Simulated Optical Node"

class StreamType(str, Enum):
    RTSP = "RTSP"
    HTTP_MJPEG = "HTTP/MJPEG"
    ONVIF = "ONVIF"
    USB_LOCAL = "USB Local"
    SIMULATED = "Simulated"

class ConnectionStatus(str, Enum):
    CONNECTED = "Connected"
    CONNECTING = "Connecting"
    DISCONNECTED = "Disconnected"
    ERROR = "Error"

class BlueprintType(str, Enum):
    SVG = "SVG"
    IMAGE = "Image"
    PDF = "PDF"
    CUSTOM_DRAWN = "Custom Drawn"

class ShapeType(str, Enum):
    RECT = "RECT"
    POLYGON = "POLYGON"
    WALL_LINE = "WALL_LINE"
    DOOR = "DOOR"
    CAMERA_NODE = "CAMERA_NODE"
    TEXT_LABEL = "TEXT_LABEL"
    FREEHAND = "FREEHAND"

class Point2D(BaseModel):
    x: float
    y: float

class CanvasShape(BaseModel):
    id: str
    type: ShapeType
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0
    points: List[Point2D] = Field(default_factory=list)
    label: Optional[str] = ""
    stroke_color: str = "#38bdf8"
    fill_color: str = "rgba(56, 189, 248, 0.15)"
    stroke_width: float = 2.0
    is_restricted: bool = False
    max_capacity: int = 10
    allowed_roles: List[str] = Field(default_factory=lambda: ["Employee", "Visitor"])

class RoomZone(BaseModel):
    id: str
    name: str
    building: str
    floor: str
    max_capacity: int
    current_occupancy: int = 0
    is_restricted: bool = False
    allowed_roles: List[str] = Field(default_factory=list)
    occupants: List[str] = Field(default_factory=list)
    x: float
    y: float
    width: float
    height: float
    shape_type: ShapeType = ShapeType.RECT
    points: List[Point2D] = Field(default_factory=list)
    color: Optional[str] = "rgba(56, 189, 248, 0.15)"

class FloorProfile(BaseModel):
    id: str
    floor_number: int
    floor_name: str
    building_id: str
    blueprint_url: Optional[str] = None
    blueprint_type: BlueprintType = BlueprintType.CUSTOM_DRAWN
    rooms: List[RoomZone] = Field(default_factory=list)
    drawing_shapes: List[CanvasShape] = Field(default_factory=list)
    camera_ids: List[str] = Field(default_factory=list)

class BuildingProfile(BaseModel):
    id: str
    name: str
    code: str
    address: str
    total_floors: int
    floors: List[FloorProfile] = Field(default_factory=list)
    description: Optional[str] = ""
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class BuildingCreateRequest(BaseModel):
    name: str
    code: str
    address: str
    total_floors: int = 4
    description: Optional[str] = ""

class FloorCreateRequest(BaseModel):
    floor_number: int
    floor_name: str
    building_id: str
    blueprint_url: Optional[str] = None
    blueprint_type: Optional[BlueprintType] = BlueprintType.CUSTOM_DRAWN

class RoomCreateRequest(BaseModel):
    name: str
    building: str
    floor: str
    max_capacity: int = 10
    is_restricted: bool = False
    allowed_roles: List[str] = Field(default_factory=lambda: ["Employee", "Visitor"])
    x: float
    y: float
    width: float
    height: float
    shape_type: Optional[ShapeType] = ShapeType.RECT
    points: Optional[List[Point2D]] = None
    color: Optional[str] = None

class BlueprintSaveRequest(BaseModel):
    building_id: str
    floor_id: str
    blueprint_url: Optional[str] = None
    blueprint_type: Optional[BlueprintType] = BlueprintType.CUSTOM_DRAWN
    shapes: List[CanvasShape] = Field(default_factory=list)
    rooms: List[RoomZone] = Field(default_factory=list)

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
    event_type: str = "ENTER"
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
    permission_type: str = "Temporary"
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
    status: str = "Online"
    connection_status: ConnectionStatus = ConnectionStatus.CONNECTED
    brand: CameraBrand = CameraBrand.SIMULATED
    stream_type: StreamType = StreamType.SIMULATED
    stream_url: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = 554
    username: Optional[str] = None
    password: Optional[str] = None
    channel: Optional[int] = 1
    device_index: Optional[int] = 0
    is_real_camera: bool = False
    last_connected_at: Optional[str] = None
    last_error: Optional[str] = None
    fps: int = 30
    resolution: str = "4K UHD (3840x2160)"
    latency_ms: int = 18
    ai_models: List[str] = Field(default_factory=lambda: ["YOLOv8", "DeepFace", "ByteTrack"])
    fov_angle: int = 90
    x_pos: float = 50.0
    y_pos: float = 50.0

class CameraConnectRequest(BaseModel):
    camera_id: Optional[str] = None
    name: str
    building: str = "Corporate Tower A"
    floor: str = "Floor 2"
    room: str = "Main Entrance"
    brand: CameraBrand = CameraBrand.GENERIC_RTSP
    stream_type: StreamType = StreamType.RTSP
    stream_url: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = 554
    username: Optional[str] = None
    password: Optional[str] = None
    channel: Optional[int] = 1
    device_index: Optional[int] = 0
    ai_models: List[str] = Field(default_factory=lambda: ["YOLOv8", "DeepFace", "ByteTrack"])
    x_pos: Optional[float] = 50.0
    y_pos: Optional[float] = 50.0

class CameraTestRequest(BaseModel):
    brand: CameraBrand
    stream_type: StreamType
    stream_url: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = 554
    username: Optional[str] = None
    password: Optional[str] = None
    channel: Optional[int] = 1
    device_index: Optional[int] = 0

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
