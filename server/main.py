import asyncio
import cv2
import base64
import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from models.schemas import (
    Person, AppearanceSnapshot, MovementEvent, Camera,
    RoomZone, SecurityAlert, SecurityRule, PersonEnrollmentRequest,
    BuildingStats, AlertStatus, AlertType, CameraConnectRequest, CameraTestRequest,
    BuildingProfile, FloorProfile, BuildingCreateRequest, FloorCreateRequest,
    RoomCreateRequest, BlueprintSaveRequest
)
from services.simulation_engine import engine
from services.camera_streamer import camera_streamer

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch Real AI Vision & Security Rules Engine background task
    sim_task = asyncio.create_task(engine.live_ai_processing_loop())
    yield
    # Shutdown: stop simulation and camera streams
    engine.is_running = False
    for cam in engine.cameras:
        camera_streamer.stop_camera(cam.camera_id)
    sim_task.cancel()

app = FastAPI(
    title="Eagle Eye - AI Security & Activity Intelligence Platform API",
    description="Real-time multi-camera tracking, universal IP camera ingestion, building blueprint designer, and situational intelligence backend.",
    version="1.2.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Hub ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await engine.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        engine.disconnect(websocket)
    except Exception:
        engine.disconnect(websocket)

# --- General System & Stats Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "system": "Eagle Eye Security Platform",
        "version": "1.2.0",
        "features": ["Universal RTSP/ONVIF", "Interactive Blueprint Designer", "Image/PDF Blueprint Upload", "2D Spatial Multi-Floor Tracking"]
    }

@app.get("/api/stats", response_model=BuildingStats)
def get_building_stats():
    return engine.get_stats()

# --- Building, Floor, and Room Management Endpoints ---

@app.get("/api/buildings", response_model=List[BuildingProfile])
def list_buildings():
    return engine.buildings

@app.post("/api/buildings", response_model=BuildingProfile)
async def create_building(req: BuildingCreateRequest):
    new_bldg = engine.add_building(req)
    await engine.broadcast({
        "type": "BUILDING_CREATED",
        "data": new_bldg.model_dump()
    })
    return new_bldg

@app.delete("/api/buildings/{building_id}")
async def delete_building(building_id: str):
    try:
        engine.delete_building(building_id)
        await engine.broadcast({
            "type": "BUILDING_DELETED",
            "data": {"building_id": building_id}
        })
        return {"success": True, "message": f"Building {building_id} deleted"}
    except ValueError:
        raise HTTPException(status_code=404, detail="Building not found")

@app.post("/api/buildings/{building_id}/floors", response_model=FloorProfile)
async def add_floor(building_id: str, req: FloorCreateRequest):
    req.building_id = building_id
    try:
        new_floor = engine.add_floor_to_building(req)
        await engine.broadcast({
            "type": "FLOOR_ADDED",
            "data": new_floor.model_dump()
        })
        return new_floor
    except ValueError:
        raise HTTPException(status_code=404, detail="Building not found")

@app.delete("/api/buildings/{building_id}/floors/{floor_id}")
async def delete_floor(building_id: str, floor_id: str):
    try:
        engine.delete_floor(building_id, floor_id)
        await engine.broadcast({
            "type": "FLOOR_DELETED",
            "data": {"building_id": building_id, "floor_id": floor_id}
        })
        return {"success": True, "message": f"Floor {floor_id} deleted"}
    except ValueError:
        raise HTTPException(status_code=404, detail="Floor or building not found")

@app.post("/api/rooms", response_model=RoomZone)
async def create_room(req: RoomCreateRequest):
    new_room = engine.add_room(req)
    await engine.broadcast({
        "type": "ROOM_CREATED",
        "data": new_room.model_dump()
    })
    return new_room

@app.delete("/api/rooms/{room_id}")
async def delete_room(room_id: str):
    try:
        engine.delete_room(room_id)
        await engine.broadcast({
            "type": "ROOM_DELETED",
            "data": {"room_id": room_id}
        })
        return {"success": True, "message": f"Room {room_id} deleted"}
    except ValueError:
        raise HTTPException(status_code=404, detail="Room not found")

@app.post("/api/blueprint/save", response_model=FloorProfile)
async def save_blueprint(req: BlueprintSaveRequest):
    try:
        saved_floor = engine.save_floor_blueprint(req)
        await engine.broadcast({
            "type": "BLUEPRINT_SAVED",
            "data": saved_floor.model_dump()
        })
        return saved_floor
    except ValueError:
        raise HTTPException(status_code=404, detail="Floor not found")

@app.post("/api/blueprint/upload")
async def upload_blueprint_file(
    file: UploadFile = File(...),
    building_id: str = Form(...),
    floor_id: str = Form(...)
):
    """Upload blueprint image (PNG/JPG/SVG/WebP) or PDF."""
    contents = await file.read()
    filename = file.filename or "blueprint"
    ext = os.path.splitext(filename)[1].lower()

    mime_type = "image/png"
    if ext in [".jpg", ".jpeg"]:
        mime_type = "image/jpeg"
    elif ext == ".svg":
        mime_type = "image/svg+xml"
    elif ext == ".pdf":
        mime_type = "application/pdf"
    elif ext == ".webp":
        mime_type = "image/webp"

    # Base64 encode for embedded rendering
    b64_data = base64.b64encode(contents).decode("utf-8")
    data_uri = f"data:{mime_type};base64,{b64_data}"

    return {
        "success": True,
        "filename": filename,
        "blueprint_url": data_uri,
        "file_type": "PDF" if ext == ".pdf" else "Image"
    }

# --- Persons & Attendance Endpoints ---

@app.get("/api/persons", response_model=List[Person])
def list_persons(role: Optional[str] = None, status: Optional[str] = None):
    results = list(engine.persons.values())
    if role:
        results = [p for p in results if p.role.lower() == role.lower()]
    if status:
        results = [p for p in results if p.status.lower() == status.lower()]
    return results

@app.get("/api/persons/{person_id}", response_model=Person)
def get_person(person_id: str):
    if person_id in engine.persons:
        return engine.persons[person_id]
    raise HTTPException(status_code=404, detail="Person not found")

@app.post("/api/persons/enroll", response_model=Person)
async def enroll_person(request: PersonEnrollmentRequest):
    new_person = engine.enroll_person(request)
    await engine.broadcast({
        "type": "NEW_PERSON_ENROLLED",
        "data": new_person.model_dump()
    })
    return new_person

@app.get("/api/persons/{person_id}/appearances", response_model=List[AppearanceSnapshot])
def get_person_appearances(person_id: str):
    if person_id in engine.appearances:
        return engine.appearances[person_id]
    return []

@app.get("/api/persons/{person_id}/timeline", response_model=List[MovementEvent])
def get_person_timeline(person_id: str):
    if person_id in engine.timelines:
        return engine.timelines[person_id]
    return []

# --- Real Camera Connection & Stream Management ---

@app.get("/api/cameras", response_model=List[Camera])
def list_cameras():
    return engine.cameras

@app.post("/api/cameras/test-connection")
def test_camera_connection(request: CameraTestRequest):
    result = engine.test_camera_connection(request)
    return result

@app.post("/api/cameras/connect", response_model=Camera)
async def connect_camera(request: CameraConnectRequest):
    camera = engine.add_or_connect_camera(request)
    await engine.broadcast({
        "type": "CAMERA_CONNECTED",
        "data": camera.model_dump()
    })
    return camera

@app.post("/api/cameras/{camera_id}/disconnect", response_model=Camera)
async def disconnect_camera(camera_id: str):
    try:
        cam = engine.disconnect_camera(camera_id)
        await engine.broadcast({
            "type": "CAMERA_DISCONNECTED",
            "data": cam.model_dump()
        })
        return cam
    except ValueError:
        raise HTTPException(status_code=404, detail="Camera not found")

@app.post("/api/cameras/{camera_id}/reconnect", response_model=Camera)
async def reconnect_camera(camera_id: str):
    try:
        cam = engine.reconnect_camera(camera_id)
        await engine.broadcast({
            "type": "CAMERA_RECONNECTED",
            "data": cam.model_dump()
        })
        return cam
    except ValueError:
        raise HTTPException(status_code=404, detail="Camera not found")

@app.delete("/api/cameras/{camera_id}")
async def delete_camera(camera_id: str):
    try:
        engine.delete_camera(camera_id)
        await engine.broadcast({
            "type": "CAMERA_DELETED",
            "data": {"camera_id": camera_id}
        })
        return {"success": True, "message": f"Camera {camera_id} removed"}
    except ValueError:
        raise HTTPException(status_code=404, detail="Camera not found")

@app.get("/api/cameras/{camera_id}/live-feed")
def get_camera_live_feed(camera_id: str):
    camera = next((c for c in engine.cameras if c.camera_id == camera_id or c.id == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    return StreamingResponse(
        camera_streamer.get_mjpeg_stream(camera),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/cameras/{camera_id}/snapshot")
def get_camera_snapshot(camera_id: str):
    camera = next((c for c in engine.cameras if c.camera_id == camera_id or c.id == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    frame = camera_streamer.get_camera_frame(camera)
    ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if ret:
        return Response(content=jpeg.tobytes(), media_type="image/jpeg")
    raise HTTPException(status_code=500, detail="Snapshot capture failed")

@app.get("/api/rooms", response_model=List[RoomZone])
def list_rooms():
    return engine.rooms

@app.get("/api/alerts", response_model=List[SecurityAlert])
def list_alerts():
    return engine.alerts

class AlertResolveRequest(BaseModel):
    notes: str
    status: AlertStatus = AlertStatus.RESOLVED

@app.post("/api/alerts/{alert_id}/resolve", response_model=SecurityAlert)
async def resolve_alert(alert_id: str, req: AlertResolveRequest):
    try:
        resolved = engine.resolve_alert(alert_id, req.notes, req.status)
        await engine.broadcast({
            "type": "ALERT_RESOLVED",
            "data": resolved.model_dump()
        })
        return resolved
    except ValueError:
        raise HTTPException(status_code=404, detail="Alert not found")

class SimulateAlertRequest(BaseModel):
    alert_type: AlertType
    room_name: str = "Server Room"

@app.post("/api/alerts/simulate", response_model=SecurityAlert)
async def trigger_simulated_alert(req: SimulateAlertRequest):
    alert = engine.trigger_simulated_alert(req.alert_type, req.room_name)
    await engine.broadcast({
        "type": "NEW_ALERT",
        "data": alert.model_dump()
    })
    return alert

@app.get("/api/rules", response_model=List[SecurityRule])
def list_rules():
    return engine.rules

@app.get("/api/reports/analytics")
def get_analytics_report():
    return {
        "hourly_traffic": [
            {"hour": "06:00", "entries": 5, "exits": 1},
            {"hour": "07:00", "entries": 18, "exits": 2},
            {"hour": "08:00", "entries": 65, "exits": 8},
            {"hour": "09:00", "entries": 112, "exits": 14},
            {"hour": "10:00", "entries": 42, "exits": 22},
            {"hour": "11:00", "entries": 14, "exits": 31},
        ],
        "incidents_by_severity": {
            "Critical": 1,
            "High": 2,
            "Medium": 1,
            "Low": 0
        },
        "zone_utilization": [
            {"zone": "Meeting Room", "utilization_pct": 85, "avg_dwell_mins": 45},
            {"zone": "Office 201", "utilization_pct": 70, "avg_dwell_mins": 120},
            {"zone": "Office 202", "utilization_pct": 50, "avg_dwell_mins": 95},
            {"zone": "Server Room", "utilization_pct": 25, "avg_dwell_mins": 15},
            {"zone": "Pantry", "utilization_pct": 40, "avg_dwell_mins": 10},
        ],
        "estimated_roi": {
            "incident_reduction": "30-50%",
            "operational_savings": "25-40%",
            "compliance_readiness": "100%",
            "payback_months": "6-12 Months"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
