import asyncio
import json
import random
import time
from datetime import datetime
from typing import Dict, List, Set, Optional
from fastapi import WebSocket
from models.schemas import (
    Person, AppearanceSnapshot, MovementEvent, Camera, 
    RoomZone, SecurityAlert, SecurityRule, PersonEnrollmentRequest,
    BuildingStats, AccessStatus, AlertSeverity, AlertType, AlertStatus, PersonRole,
    CameraConnectRequest, CameraTestRequest, CameraBrand, StreamType, ConnectionStatus,
    BuildingProfile, FloorProfile, BuildingCreateRequest, FloorCreateRequest,
    RoomCreateRequest, BlueprintSaveRequest, CanvasShape, BlueprintType, ShapeType, Point2D
)
from services.camera_streamer import camera_streamer
from seed_data.initial_state import (
    INITIAL_PERSONS, INITIAL_APPEARANCES, INITIAL_TIMELINES,
    INITIAL_ROOMS_FLOOR2, INITIAL_CAMERAS, INITIAL_ALERTS, INITIAL_RULES
)

class SimulationEngine:
    def __init__(self):
        self.persons: Dict[str, Person] = {k: v.model_copy(deep=True) for k, v in INITIAL_PERSONS.items()}
        self.appearances: Dict[str, List[AppearanceSnapshot]] = {k: [x.model_copy(deep=True) for x in v] for k, v in INITIAL_APPEARANCES.items()}
        self.timelines: Dict[str, List[MovementEvent]] = {k: [x.model_copy(deep=True) for x in v] for k, v in INITIAL_TIMELINES.items()}
        self.rooms: List[RoomZone] = [r.model_copy(deep=True) for r in INITIAL_ROOMS_FLOOR2]
        self.cameras: List[Camera] = [c.model_copy(deep=True) for c in INITIAL_CAMERAS]
        self.alerts: List[SecurityAlert] = [a.model_copy(deep=True) for a in INITIAL_ALERTS]
        self.rules: List[SecurityRule] = [r.model_copy(deep=True) for r in INITIAL_RULES]
        self.active_connections: Set[WebSocket] = set()
        self.is_running: bool = False
        self.total_entries: int = 256
        self.total_exits: int = 228

        # Buildings & Floors Profiles
        self.buildings: List[BuildingProfile] = [
            BuildingProfile(
                id="bldg-tower-a",
                name="Corporate Tower A",
                code="TWR-A",
                address="742 Evergreen Business Park, Tech Corridor",
                total_floors=4,
                description="Primary Corporate HQ & Core Engineering Facility",
                floors=[
                    FloorProfile(
                        id="fl-a-1",
                        floor_number=1,
                        floor_name="Floor 1",
                        building_id="bldg-tower-a",
                        blueprint_type=BlueprintType.SVG,
                        rooms=[],
                        camera_ids=["CAM-001", "CAM-003", "CAM-007"]
                    ),
                    FloorProfile(
                        id="fl-a-2",
                        floor_number=2,
                        floor_name="Floor 2",
                        building_id="bldg-tower-a",
                        blueprint_type=BlueprintType.SVG,
                        rooms=[r.model_copy(deep=True) for r in INITIAL_ROOMS_FLOOR2],
                        camera_ids=["CAM-014", "CAM-015", "CAM-018", "CAM-019", "CAM-021"]
                    ),
                    FloorProfile(
                        id="fl-a-3",
                        floor_number=3,
                        floor_name="Floor 3",
                        building_id="bldg-tower-a",
                        blueprint_type=BlueprintType.CUSTOM_DRAWN,
                        rooms=[],
                        camera_ids=[]
                    ),
                    FloorProfile(
                        id="fl-a-4",
                        floor_number=4,
                        floor_name="Floor 4",
                        building_id="bldg-tower-a",
                        blueprint_type=BlueprintType.CUSTOM_DRAWN,
                        rooms=[],
                        camera_ids=[]
                    )
                ]
            ),
            BuildingProfile(
                id="bldg-tower-b",
                name="Corporate Tower B",
                code="TWR-B",
                address="744 Evergreen Business Park, North Wing",
                total_floors=3,
                description="Executive Offices & Operations",
                floors=[
                    FloorProfile(
                        id="fl-b-1",
                        floor_number=1,
                        floor_name="Floor 1",
                        building_id="bldg-tower-b",
                        blueprint_type=BlueprintType.CUSTOM_DRAWN,
                        rooms=[]
                    ),
                    FloorProfile(
                        id="fl-b-2",
                        floor_number=2,
                        floor_name="Floor 2",
                        building_id="bldg-tower-b",
                        blueprint_type=BlueprintType.CUSTOM_DRAWN,
                        rooms=[]
                    )
                ]
            )
        ]

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": {
                "stats": self.get_stats().model_dump(),
                "persons": [p.model_dump() for p in self.persons.values()],
                "rooms": [r.model_dump() for r in self.rooms],
                "cameras": [c.model_dump() for c in self.cameras],
                "alerts": [a.model_dump() for a in self.alerts],
                "rules": [r.model_dump() for r in self.rules],
                "buildings": [b.model_dump() for b in self.buildings]
            }
        })

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)

    def get_stats(self) -> BuildingStats:
        total = 128
        auth = sum(1 for p in self.persons.values() if p.status == AccessStatus.AUTHORIZED) + 112
        unknown = sum(1 for p in self.persons.values() if p.status == AccessStatus.UNKNOWN or p.role == "Unknown") + 7
        active_alerts = sum(1 for a in self.alerts if a.status == AlertStatus.ACTIVE)
        online_cams = sum(1 for c in self.cameras if c.status == "Online") + 89

        return BuildingStats(
            total_in_building=total,
            authorized=auth,
            unknown=unknown,
            alerts=active_alerts,
            cameras_online=online_cams,
            total_cameras=96,
            entries_today=self.total_entries,
            exits_today=self.total_exits,
            floor_occupancies={
                "Floor 4": 32,
                "Floor 3": 28,
                "Floor 2": 38,
                "Floor 1": 30
            }
        )

    # --- Building, Floor, and Room Management ---

    def add_building(self, req: BuildingCreateRequest) -> BuildingProfile:
        bldg_id = f"bldg-{len(self.buildings)+1}-{req.code.lower()}"
        floors = []
        for f in range(1, req.total_floors + 1):
            floors.append(FloorProfile(
                id=f"fl-{bldg_id}-{f}",
                floor_number=f,
                floor_name=f"Floor {f}",
                building_id=bldg_id,
                blueprint_type=BlueprintType.CUSTOM_DRAWN,
                rooms=[]
            ))

        new_bldg = BuildingProfile(
            id=bldg_id,
            name=req.name,
            code=req.code,
            address=req.address,
            total_floors=req.total_floors,
            description=req.description or "",
            floors=floors
        )
        self.buildings.append(new_bldg)
        return new_bldg

    def delete_building(self, building_id: str):
        for i, b in enumerate(self.buildings):
            if b.id == building_id or b.name.lower() == building_id.lower():
                self.buildings.pop(i)
                return True
        raise ValueError("Building not found")

    def add_floor_to_building(self, req: FloorCreateRequest) -> FloorProfile:
        for b in self.buildings:
            if b.id == req.building_id or b.name == req.building_id:
                new_fl = FloorProfile(
                    id=f"fl-{b.id}-{req.floor_number}-{int(time.time())}",
                    floor_number=req.floor_number,
                    floor_name=req.floor_name,
                    building_id=b.id,
                    blueprint_url=req.blueprint_url,
                    blueprint_type=req.blueprint_type or BlueprintType.CUSTOM_DRAWN,
                    rooms=[]
                )
                b.floors.append(new_fl)
                b.total_floors = len(b.floors)
                return new_fl
        raise ValueError("Building not found")

    def delete_floor(self, building_id: str, floor_id: str):
        for b in self.buildings:
            if b.id == building_id or b.name == building_id:
                for i, fl in enumerate(b.floors):
                    if fl.id == floor_id or fl.floor_name.lower() == floor_id.lower():
                        b.floors.pop(i)
                        b.total_floors = len(b.floors)
                        return True
        raise ValueError("Floor not found")

    def add_room(self, req: RoomCreateRequest) -> RoomZone:
        room_id = f"room-{len(self.rooms)+1}-{int(time.time())}"
        new_room = RoomZone(
            id=room_id,
            name=req.name,
            building=req.building,
            floor=req.floor,
            max_capacity=req.max_capacity,
            current_occupancy=0,
            is_restricted=req.is_restricted,
            allowed_roles=req.allowed_roles,
            occupants=[],
            x=req.x,
            y=req.y,
            width=req.width,
            height=req.height,
            shape_type=req.shape_type or ShapeType.RECT,
            points=req.points or [],
            color=req.color or ("rgba(239, 68, 68, 0.25)" if req.is_restricted else "rgba(56, 189, 248, 0.15)")
        )
        self.rooms.append(new_room)

        # Also add to floor profile
        for b in self.buildings:
            if b.name == req.building or b.id == req.building:
                for fl in b.floors:
                    if fl.floor_name == req.floor or fl.id == req.floor:
                        fl.rooms.append(new_room)
                        break

        return new_room

    def delete_room(self, room_id: str):
        for i, r in enumerate(self.rooms):
            if r.id == room_id or r.name == room_id:
                self.rooms.pop(i)
                # Remove from building floors
                for b in self.buildings:
                    for fl in b.floors:
                        fl.rooms = [rm for rm in fl.rooms if rm.id != room_id and rm.name != room_id]
                return True
        raise ValueError("Room not found")

    def save_floor_blueprint(self, req: BlueprintSaveRequest) -> FloorProfile:
        for b in self.buildings:
            if b.id == req.building_id or b.name == req.building_id:
                for fl in b.floors:
                    if fl.id == req.floor_id or fl.floor_name == req.floor_id:
                        if req.blueprint_url:
                            fl.blueprint_url = req.blueprint_url
                        if req.blueprint_type:
                            fl.blueprint_type = req.blueprint_type
                        if req.shapes:
                            fl.drawing_shapes = req.shapes
                        if req.rooms:
                            fl.rooms = req.rooms
                            # Sync top-level rooms for Floor 2 if matching
                            if fl.floor_name == "Floor 2":
                                self.rooms = [r.model_copy(deep=True) for r in req.rooms]
                        return fl
        raise ValueError("Floor not found for blueprint update")

    # --- Person & Camera & Alert Operations ---

    def enroll_person(self, req: PersonEnrollmentRequest) -> Person:
        pid_num = len(self.persons) + 10088
        person_id = f"P-{pid_num}"
        track_id = req.temporary_track_id or f"TRK-2025-{random.randint(100000, 999999)}"
        
        default_photo = req.photo_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face"
        
        new_person = Person(
            id=f"p-{pid_num}",
            person_id=person_id,
            track_id=track_id,
            name=req.name,
            mobile=req.mobile,
            email=req.email,
            id_proof_type=req.id_proof_type,
            id_proof_number=req.id_proof_number,
            role=req.role,
            permission_type=req.permission_type,
            valid_from=req.valid_from,
            valid_to=req.valid_to,
            allowed_zones=req.allowed_zones,
            photo_url=default_photo,
            today_appearance_url=default_photo,
            status=AccessStatus.AUTHORIZED,
            notes=req.notes or "Enrolled via Security Portal",
            current_building="Corporate Tower A",
            current_floor="Floor 1",
            current_room="Reception Desk",
            current_camera_id="CAM-003",
            last_seen_time=datetime.now().strftime("%I:%M:%S %p"),
            x_pos=48.0,
            y_pos=50.0
        )
        self.persons[person_id] = new_person
        
        self.appearances[person_id] = [
            AppearanceSnapshot(
                id=f"app-{pid_num}-1",
                person_id=person_id,
                date=datetime.now().strftime("%d %b %Y"),
                time=datetime.now().strftime("%I:%M %p"),
                photo_url=default_photo,
                outfit_description="Visitor Standard Attire",
                is_today=True
            )
        ]
        
        self.timelines[person_id] = [
            MovementEvent(
                id=f"m-{pid_num}-1",
                person_id=person_id,
                track_id=track_id,
                timestamp=datetime.now().strftime("%I:%M:%S %p"),
                camera_id="CAM-003",
                building="Corporate Tower A",
                floor="Floor 1",
                room="Reception Desk",
                event_type="ENROLLED",
                dwell_time_seconds=10
            )
        ]
        
        self.total_entries += 1
        return new_person

    def resolve_alert(self, alert_id: str, notes: str, status: AlertStatus = AlertStatus.RESOLVED) -> SecurityAlert:
        for alert in self.alerts:
            if alert.id == alert_id or alert.alert_id == alert_id:
                alert.status = status
                alert.guard_notes = notes or "Resolved by Security Officer on duty."
                return alert
        raise ValueError("Alert not found")

    def trigger_simulated_alert(self, alert_type: AlertType, room_name: str = "Server Room") -> SecurityAlert:
        alt_id_num = len(self.alerts) + 105
        now_str = datetime.now().strftime("%I:%M %p")
        
        new_alert = SecurityAlert(
            id=f"alt-{alt_id_num}",
            alert_id=f"ALT-2025-0824-00{len(self.alerts)+1}",
            timestamp=now_str,
            severity=AlertSeverity.CRITICAL if "Unauthorized" in alert_type else AlertSeverity.HIGH,
            type=alert_type,
            title=f"{alert_type} - {room_name}",
            description=f"Simulated security event: {alert_type} in {room_name} triggering automated protocol.",
            building="Corporate Tower A",
            floor="Floor 2",
            room=room_name,
            camera_id="CAM-019" if "Server" in room_name else "CAM-014",
            person_id="P-UNKNOWN-1",
            track_id="TRK-2025-000941",
            person_name="Unknown Intruder",
            person_photo="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
            status=AlertStatus.ACTIVE,
            guard_notes="Automated alert dispatch dispatched."
        )
        self.alerts.insert(0, new_alert)
        return new_alert

    def test_camera_connection(self, req: CameraTestRequest) -> dict:
        return camera_streamer.test_connection(req)

    def add_or_connect_camera(self, req: CameraConnectRequest) -> Camera:
        cam_id = req.camera_id or f"CAM-{len(self.cameras) + 1:03d}"
        
        existing = next((c for c in self.cameras if c.camera_id == cam_id), None)
        if existing:
            existing.name = req.name
            existing.building = req.building
            existing.floor = req.floor
            existing.room = req.room
            existing.brand = req.brand
            existing.stream_type = req.stream_type
            existing.stream_url = req.stream_url
            existing.ip_address = req.ip_address
            existing.port = req.port
            existing.username = req.username
            existing.password = req.password
            existing.channel = req.channel
            existing.device_index = req.device_index
            existing.ai_models = req.ai_models
            existing.is_real_camera = req.stream_type != StreamType.SIMULATED
            existing.connection_status = ConnectionStatus.CONNECTING
            camera_streamer.start_camera(existing)
            return existing

        resolved_url = req.stream_url or str(camera_streamer.build_stream_url(req))
        is_real = req.stream_type != StreamType.SIMULATED

        new_cam = Camera(
            id=f"cam-{len(self.cameras)+1}",
            camera_id=cam_id,
            name=req.name,
            building=req.building,
            floor=req.floor,
            room=req.room,
            status="Online",
            connection_status=ConnectionStatus.CONNECTED if is_real else ConnectionStatus.CONNECTED,
            brand=req.brand,
            stream_type=req.stream_type,
            stream_url=resolved_url,
            ip_address=req.ip_address,
            port=req.port,
            username=req.username,
            password=req.password,
            channel=req.channel,
            device_index=req.device_index,
            is_real_camera=is_real,
            last_connected_at=datetime.now().strftime("%Y-%m-%d %I:%M:%S %p"),
            fps=30,
            resolution="1080p Full HD" if is_real else "4K UHD (3840x2160)",
            latency_ms=18,
            ai_models=req.ai_models,
            fov_angle=90,
            x_pos=req.x_pos or 50.0,
            y_pos=req.y_pos or 50.0
        )

        if is_real:
            camera_streamer.start_camera(new_cam)

        self.cameras.append(new_cam)
        return new_cam

    def disconnect_camera(self, camera_id: str) -> Camera:
        for cam in self.cameras:
            if cam.camera_id == camera_id or cam.id == camera_id:
                camera_streamer.stop_camera(cam.camera_id)
                cam.connection_status = ConnectionStatus.DISCONNECTED
                cam.status = "Offline"
                return cam
        raise ValueError("Camera not found")

    def reconnect_camera(self, camera_id: str) -> Camera:
        for cam in self.cameras:
            if cam.camera_id == camera_id or cam.id == camera_id:
                cam.connection_status = ConnectionStatus.CONNECTING
                cam.status = "Online"
                if cam.is_real_camera:
                    camera_streamer.start_camera(cam)
                else:
                    cam.connection_status = ConnectionStatus.CONNECTED
                    cam.last_connected_at = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
                return cam
        raise ValueError("Camera not found")

    def delete_camera(self, camera_id: str):
        for i, cam in enumerate(self.cameras):
            if cam.camera_id == camera_id or cam.id == camera_id:
                camera_streamer.stop_camera(cam.camera_id)
                self.cameras.pop(i)
                return True
        raise ValueError("Camera not found")

    async def simulation_loop(self):
        self.is_running = True
        step = 0
        while self.is_running:
            await asyncio.sleep(2.0)
            step += 1
            
            for pid, person in self.persons.items():
                if pid == "P-10087":
                    dx = random.uniform(-1.5, 1.5)
                    dy = random.uniform(-1.5, 1.5)
                    person.x_pos = max(60.0, min(90.0, person.x_pos + dx))
                    person.y_pos = max(38.0, min(62.0, person.y_pos + dy))
                    person.last_seen_time = datetime.now().strftime("%I:%M:%S %p")
                elif pid == "P-00182":
                    dx = random.uniform(-1.2, 1.2)
                    dy = random.uniform(-1.2, 1.2)
                    person.x_pos = max(10.0, min(35.0, person.x_pos + dx))
                    person.y_pos = max(62.0, min(90.0, person.y_pos + dy))
                elif pid == "P-00214":
                    dx = random.uniform(-1.0, 1.0)
                    dy = random.uniform(-1.0, 1.0)
                    person.x_pos = max(10.0, min(38.0, person.x_pos + dx))
                    person.y_pos = max(10.0, min(38.0, person.y_pos + dy))

            if self.active_connections:
                await self.broadcast({
                    "type": "TICK_UPDATE",
                    "data": {
                        "timestamp": datetime.now().strftime("%I:%M:%S %p"),
                        "stats": self.get_stats().model_dump(),
                        "persons": [p.model_dump() for p in self.persons.values()],
                    }
                })

engine = SimulationEngine()
