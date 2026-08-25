# Eagle Eye - An AI Security System
### Smart Building Security & Activity Intelligence Platform

[![AI Engine](https://img.shields.io/badge/AI%20Vision-YOLOv8%20%7C%20DeepFace%20%7C%20ByteTrack-blue.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript%20%7C%20TailwindCSS-sky.svg)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20WebSockets%20%7C%20Python%203.14-emerald.svg)](#)
[![License](https://img.shields.io/badge/Security-Enterprise%20Grade%20RBAC-purple.svg)](#)

Eagle Eye is a fully integrated, AI-powered physical security and situational intelligence platform engineered for corporate towers, research campuses, government facilities, and critical infrastructure. It performs real-time identification, spatial multi-camera person tracking, interactive 2D building map visualization, automated visitor enrollment, daily appearance change auditing, and threat detection.

---

## 🏛️ System Architecture

```
[ IP / CCTV Cameras / Webcams ] (96 Channels)
              │
              ▼
    [ Video Ingestion Layer ] ─── Stream Manager & Load Balancer
              │
              ▼
     [ AI Processing Engine ] ─── YOLOv8 (Detection)
              │               ─── ByteTrack (Multi-Object Tracking)
              │               ─── DeepFace / FaceNet (Recognition & Re-ID)
              │               ─── Spatial Behavior Analysis (Loitering & Geofencing)
              ▼
   [ Business Logic & Rules ] ─── Permission Engine & Zone Access
              │               ─── Automated Real-Time Alerts
              │               ─── Appearance Outfit Change Detection
              ▼
  [ Real-Time Data & Stream ] ─── FastAPI WebSocket Gateway & SQLite/Postgres
              │
              ▼
 [ Live Command Center Portal ] ─── 2D Floorplan Navigator & Live Trajectory
                              ─── Real-Time Video Matrix & Bounding Box HUD
                              ─── Automated First-Time Visitor Enrollment
                              ─── Daily Appearance Snapshot Vault
```

---

## 🚀 Key Modules & Capabilities

### 1. Live Security Command Center Dashboard
- **Top Metric Cards**: Real-time counter of total people in building, authorized personnel, unverified visitors, active security alerts, and online cameras.
- **3D Spatial Floor Breakdown**: Real-time occupancy gauges for Floor 1 to Floor 4 with entry and exit volume tallies.
- **AI Optical Stream Player**: Simulated CCTV matrix with YOLOv8 bounding boxes, confidence percentages, and `Track ID` badges.
- **Real-Time Alert Ticker**: Categorized threat feed with audio alarms and 1-click mitigation actions (*Acknowledge*, *Dispatch Guard*, *Track on Map*).

### 2. Interactive 2D Building Map & Floor Navigator
- **Multi-Building & Multi-Floor Navigation**: Seamless level switching (Basement, Floors 1–4).
- **Precision Architectural Blueprint**: Interactive zones (Office 201/202, Server Room, Executive Meeting Room, Lift Lobby, Corridors).
- **Live Moving Avatars**: Real-time person pins color-coded by security status (🟢 Authorized, 🟡 Visitor, 🔴 Alert Intruder).
- **Camera Locations & FOV Cones**: Interactive camera nodes with Field-of-View cones.
- **Slide-Over Room Inspection**: Click any zone to view capacity limits, security clearance rules, and live occupant roster.

### 3. New Person Enrollment & First-Time Entry
- **Automated Trigger**: Detects unknown faces at entry gates (CAM-001/CAM-003) and pops up an instant enrollment modal.
- **Biometric Face Capture**: Auto-cropped facial reference vector.
- **Registration Form**: Full name, mobile, email, ID proof (Aadhaar, Passport, Govt ID), role classification, validity window, and permitted zone selector.
- **Track ID Generator**: Issues unique tokens (e.g. `P-10087` / `TRK-2025-000123`) and generates a digital visitor pass.

### 4. Individual Tracking & Movement Timeline
- **Person Dossier**: Real-time photo, status badges, and exact current location.
- **Live Follow Mode**: Tracks an individual dynamically across rooms and cameras.
- **Movement Timeline**: Step-by-step room transition log with exact timestamps, camera IDs, and dwell durations.
- **Trajectory Breadcrumbs**: Visual walking path overlay on the floorplan.

### 5. Daily Appearance Snapshot & Outfit Vault
- **Reference Standard vs Today's Capture**: Master ID photo comparison against today's optical capture.
- **Multi-Day Outfit Gallery**: Historical gallery across past visits (20–24 Aug 2025).
- **AI Outfit Intelligence**: Automatic flag if an enrolled person undergoes a radical mid-day wardrobe change.

### 6. Rules & Threat Mitigation Engine
- **Configurable Policies**:
  - Restricted Zone Geofencing (Server Room / Telecom Vault breach alarms).
  - Turnstile Tailgating & Piggybacking detection (<1.5s multi-entry).
  - Corridor Loitering detection (>5 mins stationary).
  - Visitor Badge Expiration enforcement.
- **1-Click Simulation Triggers**: Test any real-time security alert immediately.

### 7. Camera Matrix & Edge Vision Node
- Grid of 96 cameras with resolution, FPS, latency, and AI model health.
- **Live Webcam Mode**: Connects to the local device camera for live demo testing.

### 8. Business ROI & Compliance Analytics
- Hourly traffic curves and room utilization heatmaps.
- **Measurable Financial ROI**: Estimated 30-50% incident reduction, 25-40% operational cost savings, and 6-12 month payback.
- **1-Click Audit Export**: Downloadable CSV audit compliance trail.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Canvas/SVG Rendering, Web Audio API
- **Backend**: Python 3.14, FastAPI, WebSockets, Uvicorn, Pydantic v2, asyncio
- **AI Models & Pipeline**: YOLOv8 (Object/Person Detection), ByteTrack (Multi-Object Tracking), DeepFace / FaceNet (Biometric Verification), OpenCV

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Node.js v18+ & npm
- Python 3.10+

### 2. Backend Setup
```bash
cd server
pip install -r requirements.txt
python main.py
```
*The FastAPI backend will start at `http://localhost:8000` with WebSocket endpoint `ws://localhost:8000/ws`.*

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*The React Command Center will open at `http://localhost:5173`.*

---

## 📜 API Documentation

When the backend is running, access Swagger API documentation at:
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`

---

## 🛡️ License & Enterprise Security
Built with Role-Based Access Control (RBAC), end-to-end event encryption, and auditable digital logs.
