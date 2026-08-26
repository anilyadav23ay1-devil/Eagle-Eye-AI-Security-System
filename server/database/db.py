import sqlite3
import json
import os
import time
from datetime import datetime
from typing import List, Dict, Optional, Any
from models.schemas import (
    Person, AppearanceSnapshot, MovementEvent, Camera, 
    RoomZone, SecurityAlert, SecurityRule, BuildingProfile, 
    FloorProfile, CanvasShape, Point2D, AccessStatus, AlertSeverity, 
    AlertType, AlertStatus, PersonRole, CameraBrand, StreamType, 
    ConnectionStatus, BlueprintType, ShapeType
)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "eagle_eye.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Buildings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            address TEXT,
            total_floors INTEGER DEFAULT 1,
            description TEXT,
            created_at TEXT
        )
    ''')

    # 2. Floors Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS floors (
            id TEXT PRIMARY KEY,
            building_id TEXT NOT NULL,
            floor_number INTEGER NOT NULL,
            floor_name TEXT NOT NULL,
            blueprint_url TEXT,
            blueprint_type TEXT DEFAULT 'Custom Drawn',
            drawing_shapes_json TEXT DEFAULT '[]',
            camera_ids_json TEXT DEFAULT '[]',
            FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
        )
    ''')

    # 3. Rooms Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            building TEXT NOT NULL,
            floor TEXT NOT NULL,
            name TEXT NOT NULL,
            max_capacity INTEGER DEFAULT 10,
            current_occupancy INTEGER DEFAULT 0,
            is_restricted INTEGER DEFAULT 0,
            allowed_roles_json TEXT DEFAULT '[]',
            occupants_json TEXT DEFAULT '[]',
            x REAL NOT NULL,
            y REAL NOT NULL,
            width REAL NOT NULL,
            height REAL NOT NULL,
            shape_type TEXT DEFAULT 'RECT',
            points_json TEXT DEFAULT '[]',
            color TEXT
        )
    ''')

    # 4. Persons Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS persons (
            id TEXT PRIMARY KEY,
            person_id TEXT UNIQUE NOT NULL,
            track_id TEXT,
            name TEXT NOT NULL,
            mobile TEXT,
            email TEXT,
            id_proof_type TEXT,
            id_proof_number TEXT,
            role TEXT DEFAULT 'Visitor',
            permission_type TEXT DEFAULT 'Temporary',
            valid_from TEXT,
            valid_to TEXT,
            allowed_zones_json TEXT DEFAULT '[]',
            photo_url TEXT,
            today_appearance_url TEXT,
            status TEXT DEFAULT 'Authorized',
            notes TEXT,
            current_building TEXT,
            current_floor TEXT,
            current_room TEXT,
            current_camera_id TEXT,
            last_seen_time TEXT,
            x_pos REAL DEFAULT 50.0,
            y_pos REAL DEFAULT 50.0,
            face_embedding_json TEXT DEFAULT '[]',
            created_at TEXT
        )
    ''')

    # 5. Appearance Snapshots Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appearance_snapshots (
            id TEXT PRIMARY KEY,
            person_id TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            photo_url TEXT NOT NULL,
            outfit_description TEXT,
            is_today INTEGER DEFAULT 0,
            FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE
        )
    ''')

    # 6. Movement Events Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS movement_events (
            id TEXT PRIMARY KEY,
            person_id TEXT NOT NULL,
            track_id TEXT,
            timestamp TEXT NOT NULL,
            camera_id TEXT,
            building TEXT,
            floor TEXT,
            room TEXT,
            event_type TEXT DEFAULT 'ENTER',
            dwell_time_seconds INTEGER DEFAULT 0
        )
    ''')

    # 7. Cameras Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cameras (
            id TEXT PRIMARY KEY,
            camera_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            building TEXT,
            floor TEXT,
            room TEXT,
            status TEXT DEFAULT 'Online',
            connection_status TEXT DEFAULT 'Connected',
            brand TEXT DEFAULT 'Generic RTSP',
            stream_type TEXT DEFAULT 'RTSP',
            stream_url TEXT,
            ip_address TEXT,
            port INTEGER DEFAULT 554,
            username TEXT,
            password TEXT,
            channel INTEGER DEFAULT 1,
            device_index INTEGER DEFAULT 0,
            is_real_camera INTEGER DEFAULT 0,
            last_connected_at TEXT,
            fps INTEGER DEFAULT 30,
            resolution TEXT DEFAULT '1080p Full HD',
            latency_ms INTEGER DEFAULT 18,
            ai_models_json TEXT DEFAULT '[]',
            fov_angle INTEGER DEFAULT 90,
            x_pos REAL DEFAULT 50.0,
            y_pos REAL DEFAULT 50.0
        )
    ''')

    # 8. Security Alerts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS security_alerts (
            id TEXT PRIMARY KEY,
            alert_id TEXT UNIQUE NOT NULL,
            timestamp TEXT NOT NULL,
            severity TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            building TEXT,
            floor TEXT,
            room TEXT,
            camera_id TEXT,
            person_id TEXT,
            track_id TEXT,
            person_name TEXT,
            person_photo TEXT,
            status TEXT DEFAULT 'Active',
            guard_notes TEXT
        )
    ''')

    # 9. Security Rules Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS security_rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            is_enabled INTEGER DEFAULT 1,
            zone_id TEXT,
            threshold_seconds INTEGER DEFAULT 0,
            severity TEXT DEFAULT 'High'
        )
    ''')

    conn.commit()
    conn.close()

# Database Helper Functions
class DatabaseManager:
    def __init__(self):
        init_db()

    def get_all_buildings(self) -> List[BuildingProfile]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM buildings ORDER BY name")
        bldg_rows = cursor.fetchall()
        
        buildings = []
        for b in bldg_rows:
            cursor.execute("SELECT * FROM floors WHERE building_id = ? ORDER BY floor_number", (b["id"],))
            floor_rows = cursor.fetchall()
            
            floors = []
            for f in floor_rows:
                cursor.execute("SELECT * FROM rooms WHERE building = ? AND floor = ?", (b["name"], f["floor_name"]))
                room_rows = cursor.fetchall()
                rooms = [self._row_to_room(r) for r in room_rows]

                shapes_raw = f["drawing_shapes_json"] or "[]"
                shapes_data = json.loads(shapes_raw)
                shapes = [CanvasShape(**s) for s in shapes_data]

                cam_ids_raw = f["camera_ids_json"] or "[]"
                cam_ids = json.loads(cam_ids_raw)

                floors.append(FloorProfile(
                    id=f["id"],
                    floor_number=f["floor_number"],
                    floor_name=f["floor_name"],
                    building_id=f["building_id"],
                    blueprint_url=f["blueprint_url"],
                    blueprint_type=f["blueprint_type"] or BlueprintType.CUSTOM_DRAWN,
                    rooms=rooms,
                    drawing_shapes=shapes,
                    camera_ids=cam_ids
                ))

            buildings.append(BuildingProfile(
                id=b["id"],
                name=b["name"],
                code=b["code"],
                address=b["address"] or "",
                total_floors=b["total_floors"],
                description=b["description"] or "",
                created_at=b["created_at"] or datetime.now().isoformat(),
                floors=floors
            ))
        conn.close()
        return buildings

    def save_building(self, bldg: BuildingProfile):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO buildings (id, name, code, address, total_floors, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (bldg.id, bldg.name, bldg.code, bldg.address, bldg.total_floors, bldg.description, bldg.created_at))

        for f in bldg.floors:
            shapes_json = json.dumps([s.model_dump() for s in f.drawing_shapes]) if f.drawing_shapes else "[]"
            cams_json = json.dumps(f.camera_ids) if f.camera_ids else "[]"
            cursor.execute('''
                INSERT OR REPLACE INTO floors (id, building_id, floor_number, floor_name, blueprint_url, blueprint_type, drawing_shapes_json, camera_ids_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (f.id, bldg.id, f.floor_number, f.floor_name, f.blueprint_url, f.blueprint_type, shapes_json, cams_json))

            for r in f.rooms:
                self._save_room_cursor(cursor, r)

        conn.commit()
        conn.close()

    def delete_building(self, building_id: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM buildings WHERE id = ? OR name = ?", (building_id, building_id))
        cursor.execute("DELETE FROM floors WHERE building_id = ?", (building_id,))
        cursor.execute("DELETE FROM rooms WHERE building = ?", (building_id,))
        conn.commit()
        conn.close()

    def save_floor_blueprint(self, building_id: str, floor_id: str, blueprint_url: Optional[str], blueprint_type: Optional[str], shapes: List[CanvasShape], rooms: List[RoomZone]):
        conn = get_db_connection()
        cursor = conn.cursor()

        shapes_json = json.dumps([s.model_dump() for s in shapes])
        
        cursor.execute('''
            UPDATE floors 
            SET blueprint_url = COALESCE(?, blueprint_url),
                blueprint_type = COALESCE(?, blueprint_type),
                drawing_shapes_json = ?
            WHERE id = ? OR floor_name = ?
        ''', (blueprint_url, blueprint_type, shapes_json, floor_id, floor_id))

        for r in rooms:
            self._save_room_cursor(cursor, r)

        conn.commit()
        conn.close()

    def _save_room_cursor(self, cursor, r: RoomZone):
        allowed_roles_json = json.dumps(r.allowed_roles)
        occupants_json = json.dumps(r.occupants)
        points_json = json.dumps([p.model_dump() for p in r.points]) if r.points else "[]"
        cursor.execute('''
            INSERT OR REPLACE INTO rooms (id, building, floor, name, max_capacity, current_occupancy, is_restricted, allowed_roles_json, occupants_json, x, y, width, height, shape_type, points_json, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (r.id, r.building, r.floor, r.name, r.max_capacity, r.current_occupancy, 1 if r.is_restricted else 0, allowed_roles_json, occupants_json, r.x, r.y, r.width, r.height, r.shape_type, points_json, r.color))

    def _row_to_room(self, r) -> RoomZone:
        allowed = json.loads(r["allowed_roles_json"] or "[]")
        occupants = json.loads(r["occupants_json"] or "[]")
        points_raw = json.loads(r["points_json"] or "[]")
        points = [Point2D(**p) for p in points_raw]
        return RoomZone(
            id=r["id"],
            building=r["building"],
            floor=r["floor"],
            name=r["name"],
            max_capacity=r["max_capacity"],
            current_occupancy=r["current_occupancy"],
            is_restricted=bool(r["is_restricted"]),
            allowed_roles=allowed,
            occupants=occupants,
            x=r["x"],
            y=r["y"],
            width=r["width"],
            height=r["height"],
            shape_type=r["shape_type"] or ShapeType.RECT,
            points=points,
            color=r["color"]
        )

    def get_all_rooms(self) -> List[RoomZone]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM rooms")
        rows = cursor.fetchall()
        rooms = [self._row_to_room(r) for r in rows]
        conn.close()
        return rooms

    def save_room(self, r: RoomZone):
        conn = get_db_connection()
        cursor = conn.cursor()
        self._save_room_cursor(cursor, r)
        conn.commit()
        conn.close()

    def delete_room(self, room_id: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM rooms WHERE id = ? OR name = ?", (room_id, room_id))
        conn.commit()
        conn.close()

    # Persons & Embeddings
    def get_all_persons(self) -> Dict[str, Person]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM persons")
        rows = cursor.fetchall()
        persons = {}
        for r in rows:
            allowed = json.loads(r["allowed_zones_json"] or "[]")
            p = Person(
                id=r["id"],
                person_id=r["person_id"],
                track_id=r["track_id"] or "",
                name=r["name"],
                mobile=r["mobile"] or "",
                email=r["email"] or "",
                id_proof_type=r["id_proof_type"] or "Aadhaar Card",
                id_proof_number=r["id_proof_number"] or "",
                role=r["role"] or PersonRole.VISITOR,
                permission_type=r["permission_type"] or "Temporary",
                valid_from=r["valid_from"] or "",
                valid_to=r["valid_to"] or "",
                allowed_zones=allowed,
                photo_url=r["photo_url"] or "",
                today_appearance_url=r["today_appearance_url"] or r["photo_url"] or "",
                status=r["status"] or AccessStatus.AUTHORIZED,
                notes=r["notes"] or "",
                current_building=r["current_building"] or "Corporate Tower A",
                current_floor=r["current_floor"] or "Floor 2",
                current_room=r["current_room"] or "Meeting Room",
                current_camera_id=r["current_camera_id"] or "CAM-021",
                last_seen_time=r["last_seen_time"] or "",
                x_pos=r["x_pos"] or 50.0,
                y_pos=r["y_pos"] or 50.0,
                created_at=r["created_at"] or datetime.now().isoformat()
            )
            persons[p.person_id] = p
        conn.close()
        return persons

    def save_person(self, p: Person, embedding: Optional[List[float]] = None):
        conn = get_db_connection()
        cursor = conn.cursor()
        allowed_json = json.dumps(p.allowed_zones)
        emb_json = json.dumps(embedding) if embedding else "[]"
        cursor.execute('''
            INSERT OR REPLACE INTO persons (
                id, person_id, track_id, name, mobile, email, id_proof_type, id_proof_number,
                role, permission_type, valid_from, valid_to, allowed_zones_json, photo_url,
                today_appearance_url, status, notes, current_building, current_floor,
                current_room, current_camera_id, last_seen_time, x_pos, y_pos, face_embedding_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p.id, p.person_id, p.track_id, p.name, p.mobile, p.email, p.id_proof_type, p.id_proof_number,
            p.role, p.permission_type, p.valid_from, p.valid_to, allowed_json, p.photo_url,
            p.today_appearance_url, p.status, p.notes, p.current_building, p.current_floor,
            p.current_room, p.current_camera_id, p.last_seen_time, p.x_pos, p.y_pos, emb_json, p.created_at
        ))
        conn.commit()
        conn.close()

    # Cameras
    def get_all_cameras(self) -> List[Camera]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cameras")
        rows = cursor.fetchall()
        cameras = []
        for r in rows:
            ai_models = json.loads(r["ai_models_json"] or "[]")
            c = Camera(
                id=r["id"],
                camera_id=r["camera_id"],
                name=r["name"],
                building=r["building"] or "Corporate Tower A",
                floor=r["floor"] or "Floor 2",
                room=r["room"] or "Main Entrance",
                status=r["status"] or "Online",
                connection_status=r["connection_status"] or ConnectionStatus.CONNECTED,
                brand=r["brand"] or CameraBrand.GENERIC_RTSP,
                stream_type=r["stream_type"] or StreamType.RTSP,
                stream_url=r["stream_url"],
                ip_address=r["ip_address"],
                port=r["port"] or 554,
                username=r["username"],
                password=r["password"],
                channel=r["channel"] or 1,
                device_index=r["device_index"] or 0,
                is_real_camera=bool(r["is_real_camera"]),
                last_connected_at=r["last_connected_at"],
                fps=r["fps"] or 30,
                resolution=r["resolution"] or "1080p Full HD",
                latency_ms=r["latency_ms"] or 18,
                ai_models=ai_models,
                fov_angle=r["fov_angle"] or 90,
                x_pos=r["x_pos"] or 50.0,
                y_pos=r["y_pos"] or 50.0
            )
            cameras.append(c)
        conn.close()
        return cameras

    def save_camera(self, c: Camera):
        conn = get_db_connection()
        cursor = conn.cursor()
        ai_json = json.dumps(c.ai_models)
        cursor.execute('''
            INSERT OR REPLACE INTO cameras (
                id, camera_id, name, building, floor, room, status, connection_status,
                brand, stream_type, stream_url, ip_address, port, username, password,
                channel, device_index, is_real_camera, last_connected_at, fps,
                resolution, latency_ms, ai_models_json, fov_angle, x_pos, y_pos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            c.id, c.camera_id, c.name, c.building, c.floor, c.room, c.status, c.connection_status,
            c.brand, c.stream_type, c.stream_url, c.ip_address, c.port, c.username, c.password,
            c.channel, c.device_index, 1 if c.is_real_camera else 0, c.last_connected_at, c.fps,
            c.resolution, c.latency_ms, ai_json, c.fov_angle, c.x_pos, c.y_pos
        ))
        conn.commit()
        conn.close()

    def delete_camera(self, camera_id: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cameras WHERE camera_id = ? OR id = ?", (camera_id, camera_id))
        conn.commit()
        conn.close()

    # Alerts & Rules
    def get_all_alerts(self) -> List[SecurityAlert]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM security_alerts ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        alerts = []
        for r in rows:
            alerts.append(SecurityAlert(
                id=r["id"],
                alert_id=r["alert_id"],
                timestamp=r["timestamp"],
                severity=r["severity"],
                type=r["type"],
                title=r["title"],
                description=r["description"] or "",
                building=r["building"] or "Corporate Tower A",
                floor=r["floor"] or "Floor 2",
                room=r["room"] or "Server Room",
                camera_id=r["camera_id"] or "CAM-019",
                person_id=r["person_id"],
                track_id=r["track_id"],
                person_name=r["person_name"],
                person_photo=r["person_photo"],
                status=r["status"] or AlertStatus.ACTIVE,
                guard_notes=r["guard_notes"] or ""
            ))
        conn.close()
        return alerts

    def save_alert(self, a: SecurityAlert):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO security_alerts (
                id, alert_id, timestamp, severity, type, title, description, building,
                floor, room, camera_id, person_id, track_id, person_name, person_photo,
                status, guard_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            a.id, a.alert_id, a.timestamp, a.severity, a.type, a.title, a.description, a.building,
            a.floor, a.room, a.camera_id, a.person_id, a.track_id, a.person_name, a.person_photo,
            a.status, a.guard_notes
        ))
        conn.commit()
        conn.close()

    def get_all_rules(self) -> List[SecurityRule]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM security_rules")
        rows = cursor.fetchall()
        rules = []
        for r in rows:
            rules.append(SecurityRule(
                id=r["id"],
                name=r["name"],
                type=r["type"],
                description=r["description"] or "",
                is_enabled=bool(r["is_enabled"]),
                zone_id=r["zone_id"],
                threshold_seconds=r["threshold_seconds"] or 0,
                severity=r["severity"] or AlertSeverity.HIGH
            ))
        conn.close()
        return rules

    def save_rule(self, rule: SecurityRule):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO security_rules (id, name, type, description, is_enabled, zone_id, threshold_seconds, severity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (rule.id, rule.name, rule.type, rule.description, 1 if rule.is_enabled else 0, rule.zone_id, rule.threshold_seconds, rule.severity))
        conn.commit()
        conn.close()

db_manager = DatabaseManager()
