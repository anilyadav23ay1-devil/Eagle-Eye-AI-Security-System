import asyncio
import json
import random
import time
from datetime import datetime
from typing import Dict, List, Set
from fastapi import WebSocket
from models.schemas import (
    Person, AppearanceSnapshot, MovementEvent, Camera, 
    RoomZone, SecurityAlert, SecurityRule, PersonEnrollmentRequest,
    BuildingStats, AccessStatus, AlertSeverity, AlertType, AlertStatus, PersonRole
)
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

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send initial full state snapshot
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": {
                "stats": self.get_stats().model_dump(),
                "persons": [p.model_dump() for p in self.persons.values()],
                "rooms": [r.model_dump() for r in self.rooms],
                "cameras": [c.model_dump() for c in self.cameras],
                "alerts": [a.model_dump() for a in self.alerts],
                "rules": [r.model_dump() for r in self.rules]
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
        
        # Add appearance snapshot
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
        
        # Add movement event
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

    async def simulation_loop(self):
        self.is_running = True
        step = 0
        while self.is_running:
            await asyncio.sleep(2.0)
            step += 1
            
            # Subtle random walk / jitter for Rahul Sharma & simulated occupants
            for pid, person in self.persons.items():
                if pid == "P-10087":
                    # Meeting Room area (x: 60-90, y: 38-62)
                    dx = random.uniform(-1.5, 1.5)
                    dy = random.uniform(-1.5, 1.5)
                    person.x_pos = max(60.0, min(90.0, person.x_pos + dx))
                    person.y_pos = max(38.0, min(62.0, person.y_pos + dy))
                    person.last_seen_time = datetime.now().strftime("%I:%M:%S %p")
                elif pid == "P-00182":
                    # Server room (x: 10-35, y: 62-90)
                    dx = random.uniform(-1.2, 1.2)
                    dy = random.uniform(-1.2, 1.2)
                    person.x_pos = max(10.0, min(35.0, person.x_pos + dx))
                    person.y_pos = max(62.0, min(90.0, person.y_pos + dy))
                elif pid == "P-00214":
                    # Office 201 (x: 10-38, y: 10-38)
                    dx = random.uniform(-1.0, 1.0)
                    dy = random.uniform(-1.0, 1.0)
                    person.x_pos = max(10.0, min(38.0, person.x_pos + dx))
                    person.y_pos = max(10.0, min(38.0, person.y_pos + dy))

            # Broadcast real-time position updates
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
