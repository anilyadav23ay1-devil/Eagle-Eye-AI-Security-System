export type PersonRole = 'Employee' | 'Visitor' | 'Contractor' | 'VIP' | 'Vendor' | 'Security';

export type AccessStatus = 'Authorized' | 'Temporary' | 'Expired' | 'Restricted' | 'Unknown' | 'Alert';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type AlertType = 
  | 'Unauthorized Access'
  | 'Tailgating Detected'
  | 'Restricted Area Access'
  | 'Unknown Person Detected'
  | 'Loitering Detected'
  | 'Permission Expired';

export type AlertStatus = 'Active' | 'Investigating' | 'Resolved' | 'False Alarm';

export type CameraBrand = 
  | 'Hikvision'
  | 'Dahua'
  | 'Axis'
  | 'CP Plus'
  | 'Reolink'
  | 'Hanwha / Samsung'
  | 'Uniview'
  | 'Amcrest'
  | 'Generic RTSP'
  | 'Mobile IP Cam (DroidCam/IP Webcam)'
  | 'Local USB / Built-in Webcam'
  | 'Simulated Optical Node';

export type StreamType = 'RTSP' | 'HTTP/MJPEG' | 'ONVIF' | 'USB Local' | 'Simulated';

export type ConnectionStatus = 'Connected' | 'Connecting' | 'Disconnected' | 'Error';

export type BlueprintType = 'SVG' | 'Image' | 'PDF' | 'Custom Drawn';

export type ShapeType = 'RECT' | 'POLYGON' | 'WALL_LINE' | 'DOOR' | 'CAMERA_NODE' | 'TEXT_LABEL' | 'FREEHAND';

export interface Point2D {
  x: number;
  y: number;
}

export interface CanvasShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  points: Point2D[];
  label?: string;
  stroke_color: string;
  fill_color: string;
  stroke_width: number;
  is_restricted: boolean;
  max_capacity: number;
  allowed_roles: string[];
}

export interface RoomZone {
  id: string;
  name: string;
  building: string;
  floor: string;
  max_capacity: number;
  current_occupancy: number;
  is_restricted: boolean;
  allowed_roles: string[];
  occupants: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  shape_type?: ShapeType;
  points?: Point2D[];
  color?: string;
}

export interface FloorProfile {
  id: string;
  floor_number: number;
  floor_name: string;
  building_id: string;
  blueprint_url?: string;
  blueprint_type: BlueprintType;
  rooms: RoomZone[];
  drawing_shapes?: CanvasShape[];
  camera_ids?: string[];
}

export interface BuildingProfile {
  id: string;
  name: string;
  code: string;
  address: string;
  total_floors: number;
  floors: FloorProfile[];
  description?: string;
  created_at?: string;
}

export interface AppearanceSnapshot {
  id: string;
  person_id: string;
  date: string;
  time: string;
  photo_url: string;
  outfit_description: string;
  is_today: boolean;
}

export interface MovementEvent {
  id: string;
  person_id: string;
  track_id: string;
  timestamp: string;
  camera_id: string;
  building: string;
  floor: string;
  room: string;
  event_type: string;
  dwell_time_seconds: number;
}

export interface Person {
  id: string;
  person_id: string;
  track_id: string;
  name: string;
  mobile: string;
  email: string;
  id_proof_type: string;
  id_proof_number: string;
  role: PersonRole;
  permission_type: string;
  valid_from: string;
  valid_to: string;
  allowed_zones: string[];
  photo_url: string;
  today_appearance_url: string;
  status: AccessStatus;
  notes?: string;
  current_building: string;
  current_floor: string;
  current_room: string;
  current_camera_id: string;
  last_seen_time: string;
  x_pos: number;
  y_pos: number;
  created_at?: string;
}

export interface Camera {
  id: string;
  camera_id: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  status: 'Online' | 'Degraded' | 'Offline';
  connection_status: ConnectionStatus;
  brand: CameraBrand;
  stream_type: StreamType;
  stream_url?: string;
  ip_address?: string;
  port?: number;
  username?: string;
  password?: string;
  channel?: number;
  device_index?: number;
  is_real_camera: boolean;
  last_connected_at?: string;
  last_error?: string;
  fps: number;
  resolution: string;
  latency_ms: number;
  ai_models: string[];
  fov_angle: number;
  x_pos: number;
  y_pos: number;
}

export interface CameraConnectPayload {
  camera_id?: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  brand: CameraBrand;
  stream_type: StreamType;
  stream_url?: string;
  ip_address?: string;
  port?: number;
  username?: string;
  password?: string;
  channel?: number;
  device_index?: number;
  ai_models: string[];
  x_pos?: number;
  y_pos?: number;
}

export interface CameraTestPayload {
  brand: CameraBrand;
  stream_type: StreamType;
  stream_url?: string;
  ip_address?: string;
  port?: number;
  username?: string;
  password?: string;
  channel?: number;
  device_index?: number;
}

export interface SecurityAlert {
  id: string;
  alert_id: string;
  timestamp: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  building: string;
  floor: string;
  room: string;
  camera_id: string;
  person_id?: string;
  track_id?: string;
  person_name?: string;
  person_photo?: string;
  status: AlertStatus;
  guard_notes?: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  type: AlertType;
  description: string;
  is_enabled: boolean;
  zone_id?: string;
  threshold_seconds?: number;
  severity: AlertSeverity;
}

export interface BuildingStats {
  total_in_building: number;
  authorized: number;
  unknown: number;
  alerts: number;
  cameras_online: number;
  total_cameras: number;
  entries_today: number;
  exits_today: number;
  floor_occupancies: Record<string, number>;
}
