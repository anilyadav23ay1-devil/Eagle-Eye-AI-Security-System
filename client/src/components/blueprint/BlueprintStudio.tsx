import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, Hexagon, Minus, DoorOpen, Camera as CameraIcon, 
  Type, PenTool, Eraser, Move, Grid, Undo2, Redo2, 
  Save, Download, Trash2, UploadCloud, Building2, Layers, Shield,
  ShieldAlert, ShieldCheck, Check, AlertTriangle, Lock, Eye, Plus 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { 
  CanvasShape, ShapeType, RoomZone, Point2D, BlueprintType, 
  BuildingProfile, FloorProfile 
} from '../../types';
import { BlueprintUploadModal } from './BlueprintUploadModal';
import { BuildingManagerModal } from './BuildingManagerModal';

export const BlueprintStudio: React.FC = () => {
  const { 
    buildings, activeBuilding, activeFloor, setActiveBuilding, setActiveFloor,
    rooms, saveBlueprint, addRoom, deleteRoom 
  } = useSecurity();

  const [currentTool, setCurrentTool] = useState<ShapeType | 'SELECT' | 'ERASER'>('RECT');
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [history, setHistory] = useState<CanvasShape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Drawing State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<Point2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point2D | null>(null);
  const [polyPoints, setPolyPoints] = useState<Point2D[]>([]);
  const [freehandPoints, setFreehandPoints] = useState<Point2D[]>([]);

  // Style State
  const [activeColor, setActiveColor] = useState<string>('#38bdf8');
  const [isRestricted, setIsRestricted] = useState<boolean>(false);
  const [zoneName, setZoneName] = useState<string>('Office Zone');
  const [maxCapacity, setMaxCapacity] = useState<number>(10);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(20);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isBldgModalOpen, setIsBldgModalOpen] = useState<boolean>(false);
  const [bgBlueprintUrl, setBgBlueprintUrl] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Selected Building and Floor objects
  const currentBldg = buildings.find(b => b.name === activeBuilding) || buildings[0];
  const currentFloorObj = currentBldg?.floors.find(f => f.floor_name === activeFloor) || currentBldg?.floors[0];

  // Initialize shapes from floor profile or seed rooms
  useEffect(() => {
    if (currentFloorObj) {
      if (currentFloorObj.drawing_shapes && currentFloorObj.drawing_shapes.length > 0) {
        setShapes(currentFloorObj.drawing_shapes);
      } else if (currentFloorObj.rooms && currentFloorObj.rooms.length > 0) {
        // Convert rooms to CanvasShapes
        const initialShapes: CanvasShape[] = currentFloorObj.rooms.map((r, i) => ({
          id: r.id || `shape-${i}`,
          type: r.shape_type || 'RECT',
          x: (r.x / 100) * 800,
          y: (r.y / 100) * 450,
          width: (r.width / 100) * 800,
          height: (r.height / 100) * 450,
          points: r.points || [],
          label: r.name,
          stroke_color: r.is_restricted ? '#ef4444' : '#38bdf8',
          fill_color: r.color || (r.is_restricted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)'),
          stroke_width: 2,
          is_restricted: r.is_restricted,
          max_capacity: r.max_capacity,
          allowed_roles: r.allowed_roles
        }));
        setShapes(initialShapes);
      }
      if (currentFloorObj.blueprint_url) {
        setBgBlueprintUrl(currentFloorObj.blueprint_url);
      }
    }
  }, [activeBuilding, activeFloor, currentFloorObj]);

  const snap = (val: number): number => {
    if (!snapToGrid) return val;
    return Math.round(val / gridSize) * gridSize;
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: snap((e.clientX - rect.left) * scaleX),
      y: snap((e.clientY - rect.top) * scaleY),
    };
  };

  // Push to undo history
  const pushHistory = (newShapes: CanvasShape[]) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newShapes);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
    }
  };

  // Canvas Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);

    if (currentTool === 'SELECT') {
      // Find clicked shape
      const clicked = [...shapes].reverse().find(s => {
        if (s.type === 'RECT') {
          return pt.x >= s.x && pt.x <= s.x + s.width && pt.y >= s.y && pt.y <= s.y + s.height;
        }
        return Math.hypot(s.x - pt.x, s.y - pt.y) < 25;
      });
      setSelectedShapeId(clicked ? clicked.id : null);
      return;
    }

    if (currentTool === 'ERASER') {
      const clicked = [...shapes].reverse().find(s => {
        if (s.type === 'RECT') {
          return pt.x >= s.x && pt.x <= s.x + s.width && pt.y >= s.y && pt.y <= s.y + s.height;
        }
        return Math.hypot(s.x - pt.x, s.y - pt.y) < 25;
      });
      if (clicked) {
        const filtered = shapes.filter(s => s.id !== clicked.id);
        setShapes(filtered);
        pushHistory(filtered);
      }
      return;
    }

    if (currentTool === 'POLYGON') {
      if (polyPoints.length > 2 && Math.hypot(polyPoints[0].x - pt.x, polyPoints[0].y - pt.y) < 20) {
        // Close polygon loop
        const newShape: CanvasShape = {
          id: `poly-${Date.now()}`,
          type: 'POLYGON',
          x: polyPoints[0].x,
          y: polyPoints[0].y,
          width: 0,
          height: 0,
          points: [...polyPoints],
          label: zoneName,
          stroke_color: activeColor,
          fill_color: isRestricted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
          stroke_width: 2,
          is_restricted: isRestricted,
          max_capacity: maxCapacity,
          allowed_roles: isRestricted ? ['Security', 'Employee'] : ['Employee', 'Visitor']
        };
        const updated = [...shapes, newShape];
        setShapes(updated);
        pushHistory(updated);
        setPolyPoints([]);
      } else {
        setPolyPoints([...polyPoints, pt]);
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(pt);
    setCurrentPoint(pt);
    if (currentTool === 'FREEHAND') {
      setFreehandPoints([pt]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);
    setCurrentPoint(pt);

    if (isDrawing && currentTool === 'FREEHAND') {
      setFreehandPoints(prev => [...prev, pt]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false);
      return;
    }

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    let newShape: CanvasShape | null = null;

    if (currentTool === 'RECT' && width > 10 && height > 10) {
      newShape = {
        id: `rect-${Date.now()}`,
        type: 'RECT',
        x,
        y,
        width,
        height,
        points: [],
        label: zoneName,
        stroke_color: activeColor,
        fill_color: isRestricted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
        stroke_width: 2,
        is_restricted: isRestricted,
        max_capacity: maxCapacity,
        allowed_roles: isRestricted ? ['Security', 'Employee'] : ['Employee', 'Visitor']
      };
    } else if (currentTool === 'WALL_LINE') {
      newShape = {
        id: `wall-${Date.now()}`,
        type: 'WALL_LINE',
        x: startPoint.x,
        y: startPoint.y,
        width: currentPoint.x,
        height: currentPoint.y,
        points: [startPoint, currentPoint],
        stroke_color: '#94a3b8',
        fill_color: 'transparent',
        stroke_width: 5,
        is_restricted: false,
        max_capacity: 0,
        allowed_roles: []
      };
    } else if (currentTool === 'DOOR') {
      newShape = {
        id: `door-${Date.now()}`,
        type: 'DOOR',
        x: startPoint.x,
        y: startPoint.y,
        width: 30,
        height: 30,
        points: [],
        label: 'Entry Point',
        stroke_color: '#10b981',
        fill_color: 'rgba(16, 185, 129, 0.25)',
        stroke_width: 2,
        is_restricted: false,
        max_capacity: 0,
        allowed_roles: []
      };
    } else if (currentTool === 'CAMERA_NODE') {
      newShape = {
        id: `cam-node-${Date.now()}`,
        type: 'CAMERA_NODE',
        x: startPoint.x,
        y: startPoint.y,
        width: 24,
        height: 24,
        points: [],
        label: `CAM-${shapes.length + 1}`,
        stroke_color: '#38bdf8',
        fill_color: '#0f172a',
        stroke_width: 2,
        is_restricted: false,
        max_capacity: 0,
        allowed_roles: []
      };
    } else if (currentTool === 'TEXT_LABEL') {
      newShape = {
        id: `text-${Date.now()}`,
        type: 'TEXT_LABEL',
        x: startPoint.x,
        y: startPoint.y,
        width: 120,
        height: 30,
        points: [],
        label: zoneName,
        stroke_color: '#f8fafc',
        fill_color: 'transparent',
        stroke_width: 1,
        is_restricted: false,
        max_capacity: 0,
        allowed_roles: []
      };
    } else if (currentTool === 'FREEHAND' && freehandPoints.length > 1) {
      newShape = {
        id: `free-${Date.now()}`,
        type: 'FREEHAND',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        points: [...freehandPoints],
        stroke_color: activeColor,
        fill_color: 'transparent',
        stroke_width: 2,
        is_restricted: false,
        max_capacity: 0,
        allowed_roles: []
      };
    }

    if (newShape) {
      const updated = [...shapes, newShape];
      setShapes(updated);
      pushHistory(updated);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setFreehandPoints([]);
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background Dark Slate
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    if (snapToGrid) {
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Render all saved shapes
    shapes.forEach(s => {
      const isSelected = s.id === selectedShapeId;

      if (s.type === 'RECT') {
        ctx.fillStyle = s.fill_color;
        ctx.fillRect(s.x, s.y, s.width, s.height);
        ctx.strokeStyle = isSelected ? '#ffffff' : s.stroke_color;
        ctx.lineWidth = isSelected ? 3 : s.stroke_width;
        ctx.strokeRect(s.x, s.y, s.width, s.height);

        // Label
        if (s.label) {
          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 12px JetBrains Mono, monospace';
          ctx.fillText(s.label, s.x + 8, s.y + 20);
          if (s.is_restricted) {
            ctx.fillStyle = '#ef4444';
            ctx.font = '9px Inter, sans-serif';
            ctx.fillText('RESTRICTED', s.x + 8, s.y + 35);
          }
        }
      } else if (s.type === 'POLYGON' && s.points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        s.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = s.fill_color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : s.stroke_color;
        ctx.lineWidth = s.stroke_width;
        ctx.stroke();
      } else if (s.type === 'WALL_LINE' && s.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        ctx.lineTo(s.points[1].x, s.points[1].y);
        ctx.strokeStyle = isSelected ? '#38bdf8' : s.stroke_color;
        ctx.lineWidth = s.stroke_width;
        ctx.stroke();
      } else if (s.type === 'DOOR') {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 14, 0, Math.PI);
        ctx.strokeStyle = s.stroke_color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (s.type === 'CAMERA_NODE') {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (s.type === 'TEXT_LABEL') {
        ctx.fillStyle = s.stroke_color;
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(s.label || '', s.x, s.y);
      } else if (s.type === 'FREEHAND' && s.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        s.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = s.stroke_color;
        ctx.lineWidth = s.stroke_width;
        ctx.stroke();
      }
    });

    // Drawing preview
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = activeColor;
      ctx.setLineDash([6, 4]);
      if (currentTool === 'RECT') {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const w = Math.abs(currentPoint.x - startPoint.x);
        const h = Math.abs(currentPoint.y - startPoint.y);
        ctx.strokeRect(x, y, w, h);
      } else if (currentTool === 'WALL_LINE') {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Polygon in-progress lines
    if (currentTool === 'POLYGON' && polyPoints.length > 0) {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
      polyPoints.forEach(p => ctx.lineTo(p.x, p.y));
      if (currentPoint) ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
  }, [shapes, isDrawing, startPoint, currentPoint, polyPoints, freehandPoints, snapToGrid, gridSize, activeColor, selectedShapeId]);

  // Save Blueprint & Sync with Live Security Map
  const handleSaveAndApply = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert drawn rectangular shapes to RoomZones for spatial tracking engine
    const roomsPayload: RoomZone[] = shapes
      .filter(s => s.type === 'RECT' || s.type === 'POLYGON')
      .map(s => ({
        id: s.id,
        name: s.label || 'Zone',
        building: activeBuilding,
        floor: activeFloor,
        max_capacity: s.max_capacity,
        current_occupancy: 0,
        is_restricted: s.is_restricted,
        allowed_roles: s.allowed_roles,
        occupants: [],
        x: (s.x / canvas.width) * 100,
        y: (s.y / canvas.height) * 100,
        width: (s.width / canvas.width) * 100,
        height: (s.height / canvas.height) * 100,
        shape_type: s.type,
        color: s.fill_color
      }));

    try {
      await saveBlueprint({
        building_id: activeBuilding,
        floor_id: activeFloor,
        blueprint_url: bgBlueprintUrl,
        blueprint_type: bgBlueprintUrl ? 'Image' : 'Custom Drawn',
        shapes,
        rooms: roomsPayload
      });

      setSaveSuccessMessage('Blueprint successfully saved & synced with live 2D security map!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (e) {
      alert('Error saving blueprint.');
    }
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `blueprint_${activeBuilding.replace(/\s+/g, '_')}_${activeFloor.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  return (
    <div className="space-y-4">
      {/* Top Studio Control Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Interactive Blueprint Studio & CAD Designer</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Architectural Mode
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Draw custom rooms, upload PDF/Image blueprints, and place cameras & security geofences
            </p>
          </div>
        </div>

        {/* Building & Floor Selector + Building Manager Modal Trigger */}
        <div className="flex items-center space-x-2">
          <select
            value={activeBuilding}
            onChange={(e) => setActiveBuilding(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-sky-500"
          >
            {buildings.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <select
            value={activeFloor}
            onChange={(e) => setActiveFloor(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-sky-500"
          >
            {currentBldg?.floors.map(fl => (
              <option key={fl.id} value={fl.floor_name}>{fl.floor_name}</option>
            ))}
          </select>

          <button
            onClick={() => setIsBldgModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Manage Facility</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Vertical Tools Bar */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-3 border border-slate-800 flex lg:flex-col items-center justify-between lg:justify-start gap-2 overflow-x-auto">
          <button
            onClick={() => setCurrentTool('SELECT')}
            title="Select & Move Tool"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'SELECT' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Move className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('RECT')}
            title="Rectangle Room Zone"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'RECT' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('POLYGON')}
            title="Polygon / L-Shaped Room"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'POLYGON' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Hexagon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('WALL_LINE')}
            title="Wall / Barrier Partition"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'WALL_LINE' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('DOOR')}
            title="Door / Turnstile Access Point"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'DOOR' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('CAMERA_NODE')}
            title="Optical Camera Node Placement"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'CAMERA_NODE' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <CameraIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('TEXT_LABEL')}
            title="Text Label"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'TEXT_LABEL' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('FREEHAND')}
            title="Freehand Sketch Pen"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'FREEHAND' ? 'bg-sky-500 text-white border-sky-400 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('ERASER')}
            title="Eraser / Delete Shape"
            className={`p-2.5 rounded-xl border transition-all ${
              currentTool === 'ERASER' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-slate-800 my-1 hidden lg:block" />

          {/* Grid Snap Toggle */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            title={snapToGrid ? "Grid Snapping ON" : "Grid Snapping OFF"}
            className={`p-2.5 rounded-xl border transition-all ${
              snapToGrid ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500' : 'bg-slate-850 text-slate-500 border-slate-700'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Center Canvas Workspace */}
        <div className="lg:col-span-8 space-y-3">
          {/* Canvas Action Strip */}
          <div className="glass-panel rounded-2xl px-4 py-2 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUndo}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF / Image Blueprint</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportPng}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PNG</span>
              </button>

              <button
                onClick={handleSaveAndApply}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Apply to Live Map</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {saveSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-pulse">
              <Check className="w-4 h-4" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Canvas Rendering Box */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl flex items-center justify-center">
            {/* Optional background uploaded blueprint image */}
            {bgBlueprintUrl && (
              <img
                src={bgBlueprintUrl}
                alt="Uploaded Blueprint"
                className="absolute inset-0 w-full h-full object-contain opacity-30 pointer-events-none"
              />
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={480}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full h-auto cursor-crosshair"
            />
          </div>
        </div>

        {/* Right Side Shape & Zone Properties Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Zone & Policy Inspector</span>
            </h3>

            {/* Zone Name input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Zone / Room Name</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Office 203"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            {/* Max Capacity */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Max Occupant Capacity</label>
              <input
                type="number"
                min={1}
                max={200}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Security Clearance Switch */}
            <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">Restricted Zone</span>
                <p className="text-[10px] text-slate-400">Trigger breach alerts for unwhitelisted badges</p>
              </div>
              <input
                type="checkbox"
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-400"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Zone Blueprint Color</label>
              <div className="flex items-center space-x-2">
                {['#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#a855f7', '#94a3b8'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      activeColor === c ? 'border-white scale-125' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Drawn Zones List with Delete Actions */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Drawn Rooms ({shapes.filter(s => s.type === 'RECT' || s.type === 'POLYGON').length})</span>
              <button
                onClick={() => { setShapes([]); pushHistory([]); }}
                className="text-[10px] text-red-400 hover:text-red-300 font-mono"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {shapes.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedShapeId(s.id)}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${
                    selectedShapeId === s.id
                      ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                      : 'bg-slate-850/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.stroke_color }} />
                    <span className="truncate">{s.label || s.type}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = shapes.filter(x => x.id !== s.id);
                      setShapes(filtered);
                      pushHistory(filtered);
                    }}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {shapes.length === 0 && (
                <p className="text-xs text-slate-500 italic py-2">Select a tool and draw rooms on the canvas.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BlueprintUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={(url) => setBgBlueprintUrl(url)}
      />

      <BuildingManagerModal
        isOpen={isBldgModalOpen}
        onClose={() => setIsBldgModalOpen(false)}
      />
    </div>
  );
};
