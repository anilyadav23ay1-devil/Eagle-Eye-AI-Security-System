import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.schemas import (
    Person, AppearanceSnapshot, MovementEvent, Camera,
    RoomZone, SecurityAlert, SecurityRule, PersonEnrollmentRequest,
    BuildingStats, AlertStatus, AlertType
)
from services.simulation_engine import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch simulation background task
    sim_task = asyncio.create_task(engine.simulation_loop())
    yield
    # Shutdown: stop simulation
    engine.is_running = False
    sim_task.cancel()

app = FastAPI(
    title="Eagle Eye - AI Security & Activity Intelligence Platform API",
    description="Real-time multi-camera tracking, authorization, and situational intelligence backend.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server
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
            # Can process incoming client commands here if needed
    except WebSocketDisconnect:
        engine.disconnect(websocket)
    except Exception:
        engine.disconnect(websocket)

# --- REST Endpoints ---

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "Eagle Eye Security Platform", "version": "1.0.0"}

@app.get("/api/stats", response_model=BuildingStats)
def get_building_stats():
    return engine.get_stats()

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

@app.get("/api/cameras", response_model=List[Camera])
def list_cameras():
    return engine.cameras

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
