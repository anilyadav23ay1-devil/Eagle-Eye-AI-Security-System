# Eagle Eye - Smart Class Attendance & Activity Intelligence
### Smart Classroom Attendance, Activity Intelligence & Spatial Analytics Platform

[![AI Engine](https://img.shields.io/badge/AI%20Vision-YOLOv8%20%7C%20DeepFace%20%7C%20ByteTrack-blue.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript%20%7C%20TailwindCSS-sky.svg)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20WebSockets%20%7C%20Python%203.14-emerald.svg)](#)
[![Attendance Intelligence](https://img.shields.io/badge/Attendance-Real--Time%20Biometric-purple.svg)](#)

**Eagle Eye - Smart Class Attendance & Activity Intelligence** is a fully integrated, AI-powered automated attendance and student activity intelligence platform. Engineered for modern academic institutions, lecture halls, smart classrooms, and university campuses, it performs real-time face verification attendance, spatial multi-camera student tracking, interactive 2D classroom & campus map visualization, automated student/visitor enrollment, attendance auditing, and activity intelligence analytics.

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

### 1. Live Smart Class Attendance & Activity Dashboard
- **Top Metric Cards**: Real-time counter of total students in class/facility, verified attendance roster, unverified visitors/guests, active classroom notifications, and online cameras.
- **3D Spatial Floor & Room Breakdown**: Real-time classroom occupancy gauges with entry and exit volume tallies.
- **AI Optical Stream Player**: Live classroom camera matrix with YOLOv8 bounding boxes, confidence percentages, and `Track ID` badges.
- **Real-Time Activity Alert Ticker**: Categorized event and attendance feed with notifications and 1-click mitigation actions (*Acknowledge*, *Verify Student*, *Track on Map*).

### 2. Interactive 2D Building Map & Floor Navigator
- **Multi-Building & Multi-Floor Navigation**: Seamless level switching (Basement, Floors 1–4).
- **Precision Architectural Blueprint**: Interactive zones (Office 201/202, Server Room, Executive Meeting Room, Lift Lobby, Corridors).
- **Live Moving Avatars**: Real-time person pins color-coded by security status (🟢 Authorized, 🟡 Visitor, 🔴 Alert Intruder).
- **Camera Locations & FOV Cones**: Interactive camera nodes with Field-of-View cones.
- **Slide-Over Room Inspection**: Click any zone to view capacity limits, security clearance rules, and live occupant roster.

### 3. Student & Faculty Enrollment & Entry
- **Automated Trigger**: Detects unregistered faces at classroom/campus entry points and opens instant enrollment.
- **Biometric Face Capture**: Auto-cropped facial reference vector.
- **Registration Form**: Full name, student/faculty ID, mobile, email, department, role classification (Student, Professor, Staff, Visitor), and permitted classrooms/labs.
- **Track ID Generator**: Issues unique tokens (e.g. `STU-10087` / `TRK-2026-000123`) and generates a digital attendance profile.

### 4. Individual Tracking & Movement Timeline
- **Student / Staff Dossier**: Real-time photo, attendance status badges, and exact current classroom location.
- **Live Follow Mode**: Tracks an individual dynamically across lecture rooms and cameras.
- **Movement Timeline**: Step-by-step room transition log with exact timestamps, camera IDs, and dwell durations.
- **Trajectory Breadcrumbs**: Visual walking path overlay on the classroom/campus floorplan.

### 5. Daily Appearance Snapshot & Outfit Vault
- **Reference Standard vs Today's Capture**: Master ID photo comparison against today's optical capture.
- **Multi-Day Outfit Gallery**: Historical gallery across past class attendance sessions.
- **AI Wardrobe Intelligence**: Automatic multi-camera re-identification across diverse attire and lighting conditions.

### 6. Rules & Threat Mitigation Engine
- **Configurable Policies**:
  - Restricted Zone Geofencing (Lab / Server Room breach alarms).
  - Proxy Attendance & Tailgating detection (<1.5s multi-entry).
  - Corridor Loitering detection (>5 mins stationary during class hours).
  - Student / Visitor Badge Expiration enforcement.
- **1-Click Simulation Triggers**: Test any real-time smart classroom notification immediately.

### 7. Camera Matrix & Edge Vision Node
- Grid of 96 cameras with resolution, FPS, latency, and AI model health.
- **Live Webcam Mode**: Connects to the local device camera for live demo testing.

### 8. Institutional Analytics & Attendance ROI
- Hourly classroom attendance curves and room utilization heatmaps.
- **Measurable Institutional ROI**: Automated 100% paperless attendance, elimination of proxy attendance, 30-50% administrative time savings, and comprehensive student engagement insights.
- **1-Click Audit Export**: Downloadable CSV attendance compliance and audit trail.

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
