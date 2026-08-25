import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  Person, Camera, RoomZone, SecurityAlert, SecurityRule, 
  BuildingStats, AppearanceSnapshot, MovementEvent, PersonRole, AccessStatus, 
  AlertSeverity, AlertType, AlertStatus, CameraConnectPayload, CameraTestPayload,
  CameraBrand, StreamType, ConnectionStatus
} from '../types';

interface SecurityContextType {
  stats: BuildingStats;
  persons: Person[];
  rooms: RoomZone[];
  cameras: Camera[];
  alerts: SecurityAlert[];
  rules: SecurityRule[];
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
  triggerUnknownPersonPrompt: () => void;
  enrollPerson: (data: any) => Promise<void>;
  resolveAlert: (alertId: string, notes: string) => Promise<void>;
  simulateAlert: (type: AlertType, roomName?: string) => Promise<void>;
  // Camera Actions
  connectCamera: (payload: CameraConnectPayload) => Promise<Camera>;
  disconnectCamera: (cameraId: string) => Promise<void>;
  reconnectCamera: (cameraId: string) => Promise<void>;
  deleteCamera: (cameraId: string) => Promise<void>;
  testCameraConnection: (payload: CameraTestPayload) => Promise<any>;
}

const DEFAULT_STATS: BuildingStats = {
  total_in_building: 128,
  authorized: 116,
  unknown: 8,
  alerts: 4,
  cameras_online: 96,
  total_cameras: 96,
  entries_today: 256,
  exits_today: 228,
  floor_occupancies: {
    'Floor 4': 32,
    'Floor 3': 28,
    'Floor 2': 38,
    'Floor 1': 30,
  },
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<BuildingStats>(DEFAULT_STATS);
  const [persons, setPersons] = useState<Person[]>([]);
  const [rooms, setRooms] = useState<RoomZone[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  
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

  // Audio chimes using Web Audio API
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
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // Connect to WebSocket & REST
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
            } else if (msg.type === 'TICK_UPDATE') {
              setStats(msg.data.stats);
              setPersons(msg.data.persons);
            } else if (msg.type === 'NEW_ALERT') {
              setAlerts(prev => [msg.data, ...prev]);
              playAlertSound(msg.data.severity);
            } else if (msg.type === 'ALERT_RESOLVED') {
              setAlerts(prev => prev.map(a => a.id === msg.data.id ? msg.data : a));
            } else if (msg.type === 'NEW_PERSON_ENROLLED') {
              setPersons(prev => [msg.data, ...prev]);
              setStats(prev => ({
                ...prev,
                authorized: prev.authorized + 1,
                unknown: Math.max(0, prev.unknown - 1),
                entries_today: prev.entries_today + 1
              }));
            } else if (msg.type === 'CAMERA_CONNECTED') {
              setCameras(prev => {
                const idx = prev.findIndex(c => c.camera_id === msg.data.camera_id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = msg.data;
                  return updated;
                }
                return [msg.data, ...prev];
              });
            } else if (msg.type === 'CAMERA_DISCONNECTED' || msg.type === 'CAMERA_RECONNECTED') {
              setCameras(prev => prev.map(c => c.camera_id === msg.data.camera_id ? msg.data : c));
            } else if (msg.type === 'CAMERA_DELETED') {
              setCameras(prev => prev.filter(c => c.camera_id !== msg.data.camera_id));
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          setTimeout(connectWs, 3000);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (e) {
        setIsConnected(false);
        setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    // Fetch HTTP backup
    fetch('http://localhost:8000/api/cameras')
      .then(r => r.json())
      .then(cams => setCameras(cams))
      .catch(() => setupLocalFallbackState());

    fetch('http://localhost:8000/api/stats')
      .then(r => r.json())
      .then(st => setStats(st))
      .catch(() => {});

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const setupLocalFallbackState = () => {
    // Initial fallback data
    const defaultCameras: Camera[] = [
      { id: 'cam-1', camera_id: 'CAM-001', name: 'Main Entrance Gate 1', building: 'Corporate Tower A', floor: 'Floor 1', room: 'Main Entrance', status: 'Online', connection_status: 'Connected', brand: 'Hikvision', stream_type: 'RTSP', stream_url: 'rtsp://admin:pass@192.168.1.101:554/live', is_real_camera: true, last_connected_at: '2025-08-24 09:30:00 AM', fps: 30, resolution: '4K UHD (3840x2160)', latency_ms: 16, ai_models: ['YOLOv8x', 'DeepFace'], fov_angle: 110, x_pos: 50, y_pos: 95 },
      { id: 'cam-3', camera_id: 'CAM-003', name: 'Reception Desk & Turnstile', building: 'Corporate Tower A', floor: 'Floor 1', room: 'Reception', status: 'Online', connection_status: 'Connected', brand: 'Dahua', stream_type: 'RTSP', stream_url: 'rtsp://admin:pass@192.168.1.103:554/cam/realmonitor', is_real_camera: true, last_connected_at: '2025-08-24 09:30:00 AM', fps: 30, resolution: '4K UHD (3840x2160)', latency_ms: 18, ai_models: ['YOLOv8x', 'FaceNet'], fov_angle: 90, x_pos: 30, y_pos: 60 },
      { id: 'cam-14', camera_id: 'CAM-014', name: 'Floor 2 North Corridor', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Corridor', status: 'Online', connection_status: 'Connected', brand: 'Axis', stream_type: 'RTSP', stream_url: 'rtsp://admin:pass@192.168.1.114:554/axis-media/media.amp', is_real_camera: true, last_connected_at: '2025-08-24 09:30:00 AM', fps: 30, resolution: '1080p Full HD', latency_ms: 14, ai_models: ['YOLOv8n', 'ByteTrack'], fov_angle: 90, x_pos: 50, y_pos: 30 },
      { id: 'cam-18', camera_id: 'CAM-018', name: 'Office 201 Internal', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Office 201', status: 'Online', connection_status: 'Connected', brand: 'CP Plus', stream_type: 'RTSP', stream_url: 'rtsp://admin:pass@192.168.1.118:554/live', is_real_camera: true, last_connected_at: '2025-08-24 09:30:00 AM', fps: 25, resolution: '1080p Full HD', latency_ms: 19, ai_models: ['YOLOv8n', 'DeepFace'], fov_angle: 85, x_pos: 38, y_pos: 8 },
      { id: 'cam-19', camera_id: 'CAM-019', name: 'Server Room Restricted Vault', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Server Room', status: 'Online', connection_status: 'Connected', brand: 'Reolink', stream_type: 'RTSP', stream_url: 'rtsp://admin:pass@192.168.1.119:554/h264Preview_01_main', is_real_camera: true, last_connected_at: '2025-08-24 09:30:00 AM', fps: 30, resolution: '4K UHD (3840x2160)', latency_ms: 15, ai_models: ['YOLOv8x', 'DeepFace', 'AnomalyNet'], fov_angle: 120, x_pos: 8, y_pos: 60 },
      { id: 'cam-21', camera_id: 'CAM-021', name: 'Executive Meeting Room A', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Meeting Room', status: 'Online', connection_status: 'Connected', brand: 'Local USB / Built-in Webcam', stream_type: 'USB Local', device_index: 0, is_real_camera: true, last_connected_at: '2025-08-24 09:30:00 AM', fps: 30, resolution: '1080p Full HD', latency_ms: 17, ai_models: ['YOLOv8x', 'DeepFace'], fov_angle: 90, x_pos: 92, y_pos: 38 },
      { id: 'cam-15', camera_id: 'CAM-015', name: 'Floor 2 Elevator Lobby', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Lift Lobby', status: 'Online', connection_status: 'Connected', brand: 'Generic RTSP', stream_type: 'RTSP', stream_url: 'rtsp://admin:pass@192.168.1.115:554/live', is_real_camera: true, last_connected_at: '2025-08-24 09:30:00 AM', fps: 30, resolution: '1080p Full HD', latency_ms: 16, ai_models: ['YOLOv8n', 'ByteTrack'], fov_angle: 90, x_pos: 59, y_pos: 92 }
    ];
    setCameras(defaultCameras);
  };

  const triggerUnknownPersonPrompt = () => {
    const randomTrackId = `TRK-2025-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomPhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face';
    setUnknownDetectionData({ trackId: randomTrackId, photoUrl: randomPhoto });
    setIsEnrollModalOpen(true);
    playAlertSound('Medium');
  };

  const enrollPerson = async (formData: any) => {
    try {
      const res = await fetch('http://localhost:8000/api/persons/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const enrolled = await res.json();
        setPersons(prev => [enrolled, ...prev]);
        setSelectedPersonId(enrolled.person_id);
      }
    } catch (e) {
      console.warn('Enrollment error', e);
    }
  };

  const resolveAlert = async (alertId: string, notes: string) => {
    try {
      await fetch(`http://localhost:8000/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, status: 'Resolved' })
      });
    } catch (e) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Resolved', guard_notes: notes } : a));
    }
  };

  const simulateAlert = async (type: AlertType, roomName: string = 'Server Room') => {
    try {
      await fetch('http://localhost:8000/api/alerts/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_type: type, room_name: roomName })
      });
    } catch (e) {
      console.warn('Simulation error', e);
    }
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
      return { success: false, message: 'Backend unreachable. Check server connection.' };
    }
  };

  const connectCamera = async (payload: CameraConnectPayload): Promise<Camera> => {
    const res = await fetch('http://localhost:8000/api/cameras/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to connect camera');
    const newCam: Camera = await res.json();
    setCameras(prev => {
      const idx = prev.findIndex(c => c.camera_id === newCam.camera_id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newCam;
        return copy;
      }
      return [newCam, ...prev];
    });
    setSelectedCameraId(newCam.camera_id);
    return newCam;
  };

  const disconnectCamera = async (cameraId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/cameras/${cameraId}/disconnect`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated = await res.json();
        setCameras(prev => prev.map(c => c.camera_id === cameraId ? updated : c));
      }
    } catch (e) {
      setCameras(prev => prev.map(c => c.camera_id === cameraId ? { ...c, connection_status: 'Disconnected', status: 'Offline' } : c));
    }
  };

  const reconnectCamera = async (cameraId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/cameras/${cameraId}/reconnect`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated = await res.json();
        setCameras(prev => prev.map(c => c.camera_id === cameraId ? updated : c));
      }
    } catch (e) {
      setCameras(prev => prev.map(c => c.camera_id === cameraId ? { ...c, connection_status: 'Connected', status: 'Online' } : c));
    }
  };

  const deleteCamera = async (cameraId: string) => {
    try {
      await fetch(`http://localhost:8000/api/cameras/${cameraId}`, {
        method: 'DELETE'
      });
      setCameras(prev => prev.filter(c => c.camera_id !== cameraId));
      if (selectedCameraId === cameraId) setSelectedCameraId(null);
    } catch (e) {
      setCameras(prev => prev.filter(c => c.camera_id !== cameraId));
    }
  };

  const toggleSound = () => setSoundEnabled(prev => !prev);
  const toggleLockdown = () => {
    setIsLockdownMode(prev => {
      const next = !prev;
      if (next) playAlertSound('Critical');
      return next;
    });
  };

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
      disconnectCamera,
      reconnectCamera,
      deleteCamera,
      testCameraConnection
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
