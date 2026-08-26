import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  Person, Camera, RoomZone, SecurityAlert, SecurityRule, 
  BuildingStats, AppearanceSnapshot, MovementEvent, PersonRole, AccessStatus, 
  AlertSeverity, AlertType, AlertStatus, CameraConnectPayload, CameraTestPayload,
  CameraBrand, StreamType, ConnectionStatus, BuildingProfile, FloorProfile, CanvasShape, BlueprintType
} from '../types';

interface SecurityContextType {
  stats: BuildingStats;
  persons: Person[];
  rooms: RoomZone[];
  cameras: Camera[];
  alerts: SecurityAlert[];
  rules: SecurityRule[];
  buildings: BuildingProfile[];
  selectedPerson: Person | null;
  selectedPersonId: string;
  selectedCamera: Camera | null;
  selectedCameraId: string | null;
  selectedRoom: RoomZone | null;
  activeFloor: string;
  activeBuilding: string;
  soundEnabled: boolean;
  isLockdownMode: boolean;
  isEnrollModalOpen: boolean;
  isConnectCamModalOpen: boolean;
  unknownDetectionData: { trackId: string; photoUrl: string } | null;
  isConnected: boolean;
  // Actions
  setSelectedPersonId: (id: string) => void;
  setSelectedCameraId: (id: string | null) => void;
  setSelectedRoomId: (id: string | null) => void;
  setActiveFloor: (floor: string) => void;
  setActiveBuilding: (bldg: string) => void;
  toggleSound: () => void;
  toggleLockdown: () => void;
  setIsEnrollModalOpen: (open: boolean) => void;
  setIsConnectCamModalOpen: (open: boolean) => void;
  triggerUnknownPersonPrompt: (customTrackId?: string, customPhotoUrl?: string) => Promise<void> | void;
  enrollPerson: (data: any) => Promise<Person | null>;
  resolveAlert: (alertId: string, notes: string) => Promise<void>;
  simulateAlert: (type: AlertType, roomName?: string) => Promise<void>;
  // Camera Actions
  connectCamera: (payload: CameraConnectPayload) => Promise<Camera>;
  connectLaptopWebcam: (deviceIndex?: number, roomName?: string) => Promise<Camera>;
  connectMobileCamera: (phoneIp: string, port?: number, streamType?: string, roomName?: string) => Promise<Camera>;
  disconnectCamera: (cameraId: string) => Promise<void>;
  reconnectCamera: (cameraId: string) => Promise<void>;
  deleteCamera: (cameraId: string) => Promise<void>;
  testCameraConnection: (payload: CameraTestPayload) => Promise<any>;
  // Building & Blueprint Actions
  createBuilding: (data: any) => Promise<BuildingProfile>;
  deleteBuilding: (buildingId: string) => Promise<void>;
  addFloor: (buildingId: string, data: any) => Promise<FloorProfile>;
  deleteFloor: (buildingId: string, floorId: string) => Promise<void>;
  addRoom: (data: any) => Promise<RoomZone>;
  deleteRoom: (roomId: string) => Promise<void>;
  uploadBlueprint: (file: File, buildingId: string, floorId: string) => Promise<any>;
  saveBlueprint: (payload: any) => Promise<FloorProfile>;
}

const DEFAULT_STATS: BuildingStats = {
  total_in_building: 128,
  authorized: 116,
  unknown: 8,
  alerts: 4,
  cameras_online: 7,
  total_cameras: 7,
  entries_today: 256,
  exits_today: 228,
  floor_occupancies: {
    'Floor 4': 32,
    'Floor 3': 28,
    'Floor 2': 38,
    'Floor 1': 30,
  },
};

// Generic list deduplication helper
function upsertItem<T>(list: T[], item: T, key: keyof T): T[] {
  const index = list.findIndex(x => x[key] === item[key]);
  if (index >= 0) {
    const copy = [...list];
    copy[index] = item;
    return copy;
  }
  return [...list, item];
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<BuildingStats>(DEFAULT_STATS);
  const [persons, setPersons] = useState<Person[]>([]);
  const [rooms, setRooms] = useState<RoomZone[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [buildings, setBuildings] = useState<BuildingProfile[]>([]);
  
  const [selectedPersonId, setSelectedPersonId] = useState<string>('P-10087');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('CAM-021');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string>('Floor 2');
  const [activeBuilding, setActiveBuilding] = useState<string>('Corporate Tower A');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLockdownMode, setIsLockdownMode] = useState<boolean>(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [isConnectCamModalOpen, setIsConnectCamModalOpen] = useState<boolean>(false);
  const [unknownDetectionData, setUnknownDetectionData] = useState<{ trackId: string; photoUrl: string } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  const playAlertSound = (severity: AlertSeverity = 'High') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (severity === 'Critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  useEffect(() => {
    let socket: WebSocket | null = null;

    const connectWs = () => {
      try {
        socket = new WebSocket('ws://localhost:8000/ws');
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'INITIAL_STATE') {
              setStats(msg.data.stats);
              setPersons(msg.data.persons);
              setRooms(msg.data.rooms);
              setCameras(msg.data.cameras);
              setAlerts(msg.data.alerts);
              setRules(msg.data.rules);
              if (msg.data.buildings) setBuildings(msg.data.buildings);
            } else if (msg.type === 'TICK_UPDATE') {
              setStats(msg.data.stats);
              setPersons(msg.data.persons);
            } else if (msg.type === 'NEW_ALERT') {
              setAlerts(prev => upsertItem(prev, msg.data, 'id'));
              playAlertSound(msg.data.severity);
            } else if (msg.type === 'ALERT_RESOLVED') {
              setAlerts(prev => prev.map(a => (a.id === msg.data.id || a.alert_id === msg.data.alert_id) ? msg.data : a));
            } else if (msg.type === 'NEW_PERSON_ENROLLED') {
              setPersons(prev => upsertItem(prev, msg.data, 'person_id'));
            } else if (msg.type === 'UNKNOWN_PERSON_DETECTED') {
              setUnknownDetectionData({
                trackId: msg.data.trackId,
                photoUrl: msg.data.photoUrl
              });
              setIsEnrollModalOpen(true);
              playAlertSound('Medium');
            } else if (msg.type === 'CAMERA_CONNECTED') {
              setCameras(prev => upsertItem(prev, msg.data, 'camera_id'));
            } else if (msg.type === 'CAMERA_DISCONNECTED' || msg.type === 'CAMERA_RECONNECTED') {
              setCameras(prev => prev.map(c => c.camera_id === msg.data.camera_id ? msg.data : c));
            } else if (msg.type === 'CAMERA_DELETED') {
              setCameras(prev => prev.filter(c => c.camera_id !== msg.data.camera_id));
            } else if (msg.type === 'BUILDING_CREATED') {
              setBuildings(prev => upsertItem(prev, msg.data, 'id'));
            } else if (msg.type === 'BUILDING_DELETED') {
              setBuildings(prev => prev.filter(b => b.id !== msg.data.building_id && b.name !== msg.data.building_id));
            } else if (msg.type === 'ROOM_CREATED') {
              setRooms(prev => upsertItem(prev, msg.data, 'id'));
            } else if (msg.type === 'ROOM_DELETED') {
              setRooms(prev => prev.filter(r => r.id !== msg.data.room_id && r.name !== msg.data.room_id));
            } else if (msg.type === 'BLUEPRINT_SAVED') {
              setBuildings(prev => prev.map(b => ({
                ...b,
                floors: b.floors.map(f => f.id === msg.data.id ? msg.data : f)
              })));
            }
          } catch (err) {}
        };

        socket.onclose = () => {
          setIsConnected(false);
          setTimeout(connectWs, 3000);
        };
      } catch (e) {
        setIsConnected(false);
      }
    };

    connectWs();

    fetch('http://localhost:8000/api/buildings')
      .then(r => r.json())
      .then(b => setBuildings(b))
      .catch(() => {});

    fetch('http://localhost:8000/api/cameras')
      .then(r => r.json())
      .then(cams => setCameras(cams))
      .catch(() => {});

    fetch('http://localhost:8000/api/rooms')
      .then(r => r.json())
      .then(rms => setRooms(rms))
      .catch(() => {});

    fetch('http://localhost:8000/api/stats')
      .then(r => r.json())
      .then(st => setStats(st))
      .catch(() => {});

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // --- Building & Blueprint API Actions (Strict Deduplication) ---

  const createBuilding = async (data: any): Promise<BuildingProfile> => {
    const res = await fetch('http://localhost:8000/api/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const bldg = await res.json();
    setBuildings(prev => upsertItem(prev, bldg, 'id'));
    setActiveBuilding(bldg.name);
    return bldg;
  };

  const deleteBuilding = async (buildingId: string) => {
    await fetch(`http://localhost:8000/api/buildings/${buildingId}`, { method: 'DELETE' });
    setBuildings(prev => prev.filter(b => b.id !== buildingId && b.name !== buildingId));
  };

  const addFloor = async (buildingId: string, data: any): Promise<FloorProfile> => {
    const res = await fetch(`http://localhost:8000/api/buildings/${buildingId}/floors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const fl = await res.json();
    setBuildings(prev => prev.map(b => (b.id === buildingId || b.name === buildingId) ? {
      ...b,
      floors: upsertItem(b.floors, fl, 'id'),
      total_floors: b.floors.length + 1
    } : b));
    return fl;
  };

  const deleteFloor = async (buildingId: string, floorId: string) => {
    await fetch(`http://localhost:8000/api/buildings/${buildingId}/floors/${floorId}`, { method: 'DELETE' });
    setBuildings(prev => prev.map(b => (b.id === buildingId || b.name === buildingId) ? {
      ...b,
      floors: b.floors.filter(f => f.id !== floorId && f.floor_name !== floorId)
    } : b));
  };

  const addRoom = async (data: any): Promise<RoomZone> => {
    const res = await fetch('http://localhost:8000/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const rm = await res.json();
    setRooms(prev => upsertItem(prev, rm, 'id'));
    return rm;
  };

  const deleteRoom = async (roomId: string) => {
    await fetch(`http://localhost:8000/api/rooms/${roomId}`, { method: 'DELETE' });
    setRooms(prev => prev.filter(r => r.id !== roomId && r.name !== roomId));
  };

  const uploadBlueprint = async (file: File, buildingId: string, floorId: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('building_id', buildingId);
    formData.append('floor_id', floorId);

    const res = await fetch('http://localhost:8000/api/blueprint/upload', {
      method: 'POST',
      body: formData
    });
    return await res.json();
  };

  const saveBlueprint = async (payload: any): Promise<FloorProfile> => {
    const res = await fetch('http://localhost:8000/api/blueprint/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const saved = await res.json();
    return saved;
  };

  // --- Real Camera Actions ---

  const testCameraConnection = async (payload: CameraTestPayload) => {
    try {
      const res = await fetch('http://localhost:8000/api/cameras/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Backend unreachable.' };
    }
  };

  const connectCamera = async (payload: CameraConnectPayload): Promise<Camera> => {
    const res = await fetch('http://localhost:8000/api/cameras/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const newCam: Camera = await res.json();
    setCameras(prev => upsertItem(prev, newCam, 'camera_id'));
    setSelectedCameraId(newCam.camera_id);
    return newCam;
  };

  // 1-Click Laptop Webcam Connection Helper
  const connectLaptopWebcam = async (deviceIndex: number = 0, roomName: string = 'Server Room'): Promise<Camera> => {
    const payload: CameraConnectPayload = {
      camera_id: 'CAM-LAPTOP',
      name: `Laptop Integrated Webcam (Device #${deviceIndex})`,
      building: activeBuilding,
      floor: activeFloor,
      room: roomName,
      brand: 'Local USB / Built-in Webcam',
      stream_type: 'USB Local',
      device_index: deviceIndex,
      ai_models: ['YOLOv8', 'CentroidTracker', 'HUDAnnotator']
    };
    const cam = await connectCamera(payload);
    setSelectedCameraId(cam.camera_id);
    return cam;
  };

  // 1-Click Mobile Phone Camera Connection Helper
  const connectMobileCamera = async (phoneIp: string, port: number = 8080, streamType: string = 'IP_WEBCAM', roomName: string = 'Main Entrance'): Promise<Camera> => {
    let streamUrl = `http://${phoneIp}:${port}/video`;
    if (streamType === 'DROIDCAM') {
      streamUrl = `http://${phoneIp}:${port || 4747}/video`;
    } else if (streamType === 'RTSP_MOBILE') {
      streamUrl = `rtsp://${phoneIp}:${port || 8080}/h264_pcm.sdp`;
    }

    const payload: CameraConnectPayload = {
      name: `Mobile Optical Cam (${phoneIp})`,
      building: activeBuilding,
      floor: activeFloor,
      room: roomName,
      brand: 'Mobile IP Cam (DroidCam/IP Webcam)',
      stream_type: 'HTTP/MJPEG',
      stream_url: streamUrl,
      ip_address: phoneIp,
      port: port,
      ai_models: ['YOLOv8', 'CentroidTracker', 'HUDAnnotator']
    };
    return await connectCamera(payload);
  };

  const disconnectCamera = async (cameraId: string) => {
    const res = await fetch(`http://localhost:8000/api/cameras/${cameraId}/disconnect`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setCameras(prev => prev.map(c => c.camera_id === cameraId ? updated : c));
    }
  };

  const reconnectCamera = async (cameraId: string) => {
    const res = await fetch(`http://localhost:8000/api/cameras/${cameraId}/reconnect`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setCameras(prev => prev.map(c => c.camera_id === cameraId ? updated : c));
    }
  };

  const deleteCamera = async (cameraId: string) => {
    await fetch(`http://localhost:8000/api/cameras/${cameraId}`, { method: 'DELETE' });
    setCameras(prev => prev.filter(c => c.camera_id !== cameraId));
  };

  const triggerUnknownPersonPrompt = async (customTrackId?: string, customPhotoUrl?: string) => {
    if (customPhotoUrl) {
      setUnknownDetectionData({ 
        trackId: customTrackId || `TRK-2025-${Math.floor(100000 + Math.random() * 900000)}`, 
        photoUrl: customPhotoUrl 
      });
      setIsEnrollModalOpen(true);
      playAlertSound('Medium');
      return;
    }

    try {
      const targetCam = selectedCameraId || 'CAM-021';
      const res = await fetch(`http://localhost:8000/api/cameras/${targetCam}/capture-person`);
      if (res.ok) {
        const data = await res.json();
        if (data.photoUrl) {
          setUnknownDetectionData({ trackId: data.trackId, photoUrl: data.photoUrl });
          setIsEnrollModalOpen(true);
          playAlertSound('Medium');
          return;
        }
      }
    } catch (e) {
      console.warn('Live capture fetch fallback:', e);
    }

    const randomTrackId = `TRK-2025-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomPhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
    setUnknownDetectionData({ trackId: randomTrackId, photoUrl: randomPhoto });
    setIsEnrollModalOpen(true);
    playAlertSound('Medium');
  };

  const enrollPerson = async (formData: any): Promise<Person | null> => {
    const res = await fetch('http://localhost:8000/api/persons/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      const enrolled = await res.json();
      setPersons(prev => upsertItem(prev, enrolled, 'person_id'));
      return enrolled;
    }
    return null;
  };

  const resolveAlert = async (alertId: string, notes: string) => {
    const res = await fetch(`http://localhost:8000/api/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, status: 'Resolved' })
    });
    if (res.ok) {
      const resolved = await res.json();
      setAlerts(prev => prev.map(a => (a.id === alertId || a.alert_id === alertId) ? resolved : a));
    }
  };

  const simulateAlert = async (type: AlertType, roomName: string = 'Server Room') => {
    const res = await fetch('http://localhost:8000/api/alerts/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_type: type, room_name: roomName })
    });
    if (res.ok) {
      const alert = await res.json();
      setAlerts(prev => upsertItem(prev, alert, 'id'));
      playAlertSound(alert.severity);
    }
  };

  const toggleSound = () => setSoundEnabled(prev => !prev);
  const toggleLockdown = () => setIsLockdownMode(prev => !prev);

  const selectedPerson = persons.find(p => p.person_id === selectedPersonId) || persons[0] || null;
  const selectedCamera = cameras.find(c => c.camera_id === selectedCameraId) || cameras[0] || null;
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  return (
    <SecurityContext.Provider value={{
      stats,
      persons,
      rooms,
      cameras,
      alerts,
      rules,
      buildings,
      selectedPerson,
      selectedPersonId,
      selectedCamera,
      selectedCameraId,
      selectedRoom,
      activeFloor,
      activeBuilding,
      soundEnabled,
      isLockdownMode,
      isEnrollModalOpen,
      isConnectCamModalOpen,
      unknownDetectionData,
      isConnected,
      setSelectedPersonId,
      setSelectedCameraId,
      setSelectedRoomId,
      setActiveFloor,
      setActiveBuilding,
      toggleSound,
      toggleLockdown,
      setIsEnrollModalOpen,
      setIsConnectCamModalOpen,
      triggerUnknownPersonPrompt,
      enrollPerson,
      resolveAlert,
      simulateAlert,
      connectCamera,
      connectLaptopWebcam,
      connectMobileCamera,
      disconnectCamera,
      reconnectCamera,
      deleteCamera,
      testCameraConnection,
      createBuilding,
      deleteBuilding,
      addFloor,
      deleteFloor,
      addRoom,
      deleteRoom,
      uploadBlueprint,
      saveBlueprint
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within SecurityProvider');
  return context;
};
