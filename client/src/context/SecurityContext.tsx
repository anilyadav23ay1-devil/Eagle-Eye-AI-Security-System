import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  Person, Camera, RoomZone, SecurityAlert, SecurityRule, 
  BuildingStats, AppearanceSnapshot, MovementEvent, PersonRole, AccessStatus, AlertSeverity, AlertType, AlertStatus 
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
  selectedRoom: RoomZone | null;
  activeFloor: string;
  activeBuilding: string;
  soundEnabled: boolean;
  isLockdownMode: boolean;
  isEnrollModalOpen: boolean;
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
  triggerUnknownPersonPrompt: () => void;
  enrollPerson: (data: any) => Promise<void>;
  resolveAlert: (alertId: string, notes: string) => Promise<void>;
  simulateAlert: (type: AlertType, roomName?: string) => Promise<void>;
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
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string>('Floor 2');
  const [activeBuilding, setActiveBuilding] = useState<string>('Corporate Tower A');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLockdownMode, setIsLockdownMode] = useState<boolean>(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
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
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // Connect to WebSocket / HTTP fallback
  useEffect(() => {
    let socket: WebSocket | null = null;
    let fallbackInterval: any = null;

    const connectWs = () => {
      try {
        socket = new WebSocket('ws://localhost:8000/ws');
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          console.log('[EagleEye WS] Connected to backend');
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
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          console.log('[EagleEye WS] Disconnected. Retrying in 3s...');
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

    // Fetch initial HTTP backup if backend is reachable
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {
        // Fallback demo state if standalone without backend
        setupLocalFallbackState();
      });

    return () => {
      if (socket) socket.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  const setupLocalFallbackState = () => {
    // Standalone demo seed
    const defaultPersons: Person[] = [
      {
        id: 'p1',
        person_id: 'P-10087',
        track_id: 'TRK-25-000567',
        name: 'Rahul Sharma',
        mobile: '9876543210',
        email: 'rahul.sharma@email.com',
        id_proof_type: 'Aadhaar Card',
        id_proof_number: '1234 5678 9012',
        role: 'Visitor',
        permission_type: 'Temporary',
        valid_from: '2025-08-24 10:00 AM',
        valid_to: '2025-08-24 06:00 PM',
        allowed_zones: ['Floor 1 - Reception', 'Floor 2 - Meeting Room', 'Floor 2 - Office 201'],
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
        today_appearance_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
        status: 'Authorized',
        notes: 'Meeting with AI Platform Architect',
        current_building: 'Corporate Tower A',
        current_floor: 'Floor 2',
        current_room: 'Meeting Room',
        current_camera_id: 'CAM-021',
        last_seen_time: '10:24:32 AM',
        x_pos: 72.0,
        y_pos: 46.0
      },
      {
        id: 'p2',
        person_id: 'P-00182',
        track_id: 'TRK-2025-000089',
        name: 'Amit Kumar',
        mobile: '9811223344',
        email: 'amit.kumar@corp.com',
        id_proof_type: 'Passport',
        id_proof_number: 'Z8942110',
        role: 'Employee',
        permission_type: 'Permanent',
        valid_from: '2024-01-01 00:00 AM',
        valid_to: '2027-12-31 11:59 PM',
        allowed_zones: ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4 - Server Hub'],
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
        today_appearance_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
        status: 'Authorized',
        notes: 'Lead Systems Architect',
        current_building: 'Corporate Tower A',
        current_floor: 'Floor 2',
        current_room: 'Server Room',
        current_camera_id: 'CAM-019',
        last_seen_time: '10:25:01 AM',
        x_pos: 20.0,
        y_pos: 75.0
      },
      {
        id: 'p3',
        person_id: 'P-00214',
        track_id: 'TRK-2025-000104',
        name: 'Priya Singh',
        mobile: '9877665544',
        email: 'priya.singh@corp.com',
        id_proof_type: 'National ID',
        id_proof_number: 'ID-994821',
        role: 'Employee',
        permission_type: 'Permanent',
        valid_from: '2024-03-01 00:00 AM',
        valid_to: '2027-12-31 11:59 PM',
        allowed_zones: ['Floor 1', 'Floor 2', 'Floor 3'],
        photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
        today_appearance_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
        status: 'Authorized',
        notes: 'Product Operations Manager',
        current_building: 'Corporate Tower A',
        current_floor: 'Floor 2',
        current_room: 'Office 201',
        current_camera_id: 'CAM-018',
        last_seen_time: '10:24:15 AM',
        x_pos: 22.0,
        y_pos: 28.0
      },
      {
        id: 'p4',
        person_id: 'P-00305',
        track_id: 'TRK-2025-000155',
        name: 'Vikram Patel',
        mobile: '9899887766',
        email: 'vikram.patel@corp.com',
        id_proof_type: 'Aadhaar Card',
        id_proof_number: '8832 9912 0019',
        role: 'Security',
        permission_type: 'Permanent',
        valid_from: '2024-01-01 00:00 AM',
        valid_to: '2028-12-31 11:59 PM',
        allowed_zones: ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'],
        photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face',
        today_appearance_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face',
        status: 'Authorized',
        notes: 'Head of Physical Security',
        current_building: 'Corporate Tower A',
        current_floor: 'Floor 2',
        current_room: 'Elevator Lobby',
        current_camera_id: 'CAM-015',
        last_seen_time: '10:25:12 AM',
        x_pos: 64.0,
        y_pos: 78.0
      },
      {
        id: 'p5',
        person_id: 'P-UNKNOWN-1',
        track_id: 'TRK-2025-000941',
        name: 'Unknown Intruder #941',
        mobile: 'Unregistered',
        email: 'unknown@visitor',
        id_proof_type: 'None',
        id_proof_number: 'N/A',
        role: 'Visitor',
        permission_type: 'None',
        valid_from: 'N/A',
        valid_to: 'N/A',
        allowed_zones: [],
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
        today_appearance_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
        status: 'Alert',
        notes: 'Unregistered entry in Server Room',
        current_building: 'Corporate Tower A',
        current_floor: 'Floor 2',
        current_room: 'Server Room',
        current_camera_id: 'CAM-019',
        last_seen_time: '10:24:55 AM',
        x_pos: 28.0,
        y_pos: 80.0
      }
    ];

    const defaultRooms: RoomZone[] = [
      { id: 'room-201', name: 'Office 201', building: 'Corporate Tower A', floor: 'Floor 2', max_capacity: 10, current_occupancy: 4, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: ['P-00214'], x: 5, y: 5, width: 38, height: 38 },
      { id: 'room-202', name: 'Office 202', building: 'Corporate Tower A', floor: 'Floor 2', max_capacity: 8, current_occupancy: 2, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: [], x: 57, y: 5, width: 38, height: 28 },
      { id: 'room-meeting', name: 'Meeting Room', building: 'Corporate Tower A', floor: 'Floor 2', max_capacity: 16, current_occupancy: 8, is_restricted: false, allowed_roles: ['Employee', 'Visitor', 'VIP'], occupants: ['P-10087'], x: 57, y: 35, width: 38, height: 32 },
      { id: 'room-server', name: 'Server Room', building: 'Corporate Tower A', floor: 'Floor 2', max_capacity: 4, current_occupancy: 3, is_restricted: true, allowed_roles: ['Security', 'Employee'], occupants: ['P-00182', 'P-UNKNOWN-1'], x: 5, y: 58, width: 38, height: 37 },
      { id: 'room-corridor', name: 'Corridor', building: 'Corporate Tower A', floor: 'Floor 2', max_capacity: 50, current_occupancy: 7, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: [], x: 44, y: 5, width: 12, height: 90 },
      { id: 'room-lift', name: 'Lift Lobby', building: 'Corporate Tower A', floor: 'Floor 2', max_capacity: 20, current_occupancy: 2, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: ['P-00305'], x: 57, y: 69, width: 22, height: 26 },
      { id: 'room-pantry', name: 'Pantry', building: 'Corporate Tower A', floor: 'Floor 2', max_capacity: 10, current_occupancy: 1, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: [], x: 80, y: 69, width: 15, height: 26 }
    ];

    const defaultCameras: Camera[] = [
      { id: 'cam-1', camera_id: 'CAM-001', name: 'Main Entrance Gate 1', building: 'Corporate Tower A', floor: 'Floor 1', room: 'Main Entrance', status: 'Online', fps: 30, resolution: '4K UHD (3840x2160)', latency_ms: 16, ai_models: ['YOLOv8x', 'DeepFace'], fov_angle: 110, x_pos: 50, y_pos: 95 },
      { id: 'cam-3', camera_id: 'CAM-003', name: 'Reception Desk', building: 'Corporate Tower A', floor: 'Floor 1', room: 'Reception', status: 'Online', fps: 30, resolution: '4K UHD (3840x2160)', latency_ms: 18, ai_models: ['YOLOv8x', 'FaceNet'], fov_angle: 90, x_pos: 30, y_pos: 60 },
      { id: 'cam-14', camera_id: 'CAM-014', name: 'Floor 2 Corridor', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Corridor', status: 'Online', fps: 30, resolution: '1080p Full HD', latency_ms: 14, ai_models: ['YOLOv8n', 'ByteTrack'], fov_angle: 90, x_pos: 50, y_pos: 30 },
      { id: 'cam-18', camera_id: 'CAM-018', name: 'Office 201 Internal', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Office 201', status: 'Online', fps: 25, resolution: '1080p Full HD', latency_ms: 19, ai_models: ['YOLOv8n', 'DeepFace'], fov_angle: 85, x_pos: 38, y_pos: 8 },
      { id: 'cam-19', camera_id: 'CAM-019', name: 'Server Room Vault', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Server Room', status: 'Online', fps: 30, resolution: '4K UHD (3840x2160)', latency_ms: 15, ai_models: ['YOLOv8x', 'DeepFace', 'AnomalyNet'], fov_angle: 120, x_pos: 8, y_pos: 60 },
      { id: 'cam-21', camera_id: 'CAM-021', name: 'Executive Meeting Room', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Meeting Room', status: 'Online', fps: 30, resolution: '4K UHD (3840x2160)', latency_ms: 17, ai_models: ['YOLOv8x', 'DeepFace'], fov_angle: 90, x_pos: 92, y_pos: 38 },
      { id: 'cam-15', camera_id: 'CAM-015', name: 'Elevator Lobby 2', building: 'Corporate Tower A', floor: 'Floor 2', room: 'Lift Lobby', status: 'Online', fps: 30, resolution: '1080p Full HD', latency_ms: 16, ai_models: ['YOLOv8n', 'ByteTrack'], fov_angle: 90, x_pos: 59, y_pos: 92 }
    ];

    const defaultAlerts: SecurityAlert[] = [
      {
        id: 'alt-101',
        alert_id: 'ALT-2025-0824-001',
        timestamp: '10:24 AM',
        severity: 'Critical',
        type: 'Unauthorized Access',
        title: 'Unauthorized Access - Server Room',
        description: 'Unregistered person TRK-2025-000941 detected inside restricted Server Room without clearance.',
        building: 'Corporate Tower A',
        floor: 'Floor 2',
        room: 'Server Room',
        camera_id: 'CAM-019',
        person_id: 'P-UNKNOWN-1',
        track_id: 'TRK-2025-000941',
        person_name: 'Unknown Individual #941',
        person_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
        status: 'Active',
        guard_notes: 'Guard unit 2 dispatched to floor 2 server room.'
      },
      {
        id: 'alt-102',
        alert_id: 'ALT-2025-0824-002',
        timestamp: '10:21 AM',
        severity: 'High',
        type: 'Tailgating Detected',
        title: 'Tailgating Detected - Main Entrance',
        description: 'Two individuals passed through Turnstile 3 on a single badge scan.',
        building: 'Corporate Tower A',
        floor: 'Floor 1',
        room: 'Main Entrance',
        camera_id: 'CAM-001',
        status: 'Investigating',
        guard_notes: 'Front desk reviewing optical sensor playback.'
      },
      {
        id: 'alt-103',
        alert_id: 'ALT-2025-0824-003',
        timestamp: '10:18 AM',
        severity: 'High',
        type: 'Restricted Area Access',
        title: 'Restricted Area Access - Floor 4',
        description: 'Contractor TRK-2025-000412 entered Floor 4 Telecom Hub without escort.',
        building: 'Corporate Tower A',
        floor: 'Floor 4',
        room: 'Telecom Hub',
        camera_id: 'CAM-041',
        status: 'Resolved',
        guard_notes: 'Verified escort arrived at 10:20 AM.'
      },
      {
        id: 'alt-104',
        alert_id: 'ALT-2025-0824-004',
        timestamp: '10:15 AM',
        severity: 'Medium',
        type: 'Unknown Person Detected',
        title: 'Unknown Person Detected - Floor 1',
        description: 'Unregistered visitor loitering near Executive Elevator for > 5 minutes.',
        building: 'Corporate Tower A',
        floor: 'Floor 1',
        room: 'Elevator Lobby',
        camera_id: 'CAM-007',
        status: 'Resolved',
        guard_notes: 'Escorted to Reception for visitor registration.'
      }
    ];

    setPersons(defaultPersons);
    setRooms(defaultRooms);
    setCameras(defaultCameras);
    setAlerts(defaultAlerts);
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
      // Local fallback
      const pidNum = persons.length + 10089;
      const personId = `P-${pidNum}`;
      const newPerson: Person = {
        id: `p-${pidNum}`,
        person_id: personId,
        track_id: formData.temporary_track_id || `TRK-2025-${Math.floor(100000 + Math.random() * 900000)}`,
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        id_proof_type: formData.id_proof_type,
        id_proof_number: formData.id_proof_number,
        role: formData.role,
        permission_type: formData.permission_type,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        allowed_zones: formData.allowed_zones,
        photo_url: formData.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face',
        today_appearance_url: formData.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face',
        status: 'Authorized',
        notes: formData.notes,
        current_building: 'Corporate Tower A',
        current_floor: 'Floor 1',
        current_room: 'Reception Desk',
        current_camera_id: 'CAM-003',
        last_seen_time: new Date().toLocaleTimeString(),
        x_pos: 48,
        y_pos: 50
      };
      setPersons(prev => [newPerson, ...prev]);
      setSelectedPersonId(personId);
      setStats(prev => ({
        ...prev,
        authorized: prev.authorized + 1,
        unknown: Math.max(0, prev.unknown - 1),
        entries_today: prev.entries_today + 1
      }));
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
      const newAlert: SecurityAlert = {
        id: `alt-sim-${Date.now()}`,
        alert_id: `ALT-2025-0824-00${alerts.length + 1}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: type === 'Unauthorized Access' ? 'Critical' : 'High',
        type: type,
        title: `${type} - ${roomName}`,
        description: `Simulated intrusion event in ${roomName} triggering Eagle Eye response protocol.`,
        building: 'Corporate Tower A',
        floor: 'Floor 2',
        room: roomName,
        camera_id: 'CAM-019',
        person_id: 'P-UNKNOWN-1',
        track_id: 'TRK-2025-000941',
        person_name: 'Unknown Intruder #941',
        person_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
        status: 'Active',
        guard_notes: 'Tactical security unit alerted.'
      };
      setAlerts(prev => [newAlert, ...prev]);
      playAlertSound(newAlert.severity);
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
  const selectedCamera = cameras.find(c => c.camera_id === selectedCameraId) || null;
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
      selectedRoom,
      activeFloor,
      activeBuilding,
      soundEnabled,
      isLockdownMode,
      isEnrollModalOpen,
      unknownDetectionData,
      isConnected,
      setSelectedPersonId,
      setSelectedCameraId: (id) => setSelectedCameraId(id),
      setSelectedRoomId: (id) => setSelectedRoomId(id),
      setActiveFloor,
      setActiveBuilding,
      toggleSound,
      toggleLockdown,
      setIsEnrollModalOpen,
      triggerUnknownPersonPrompt,
      enrollPerson,
      resolveAlert,
      simulateAlert
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
