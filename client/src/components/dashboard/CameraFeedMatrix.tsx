import React, { useState, useEffect, useRef } from 'react';
import { Camera, Maximize2, Radio, Video, Layers, Crosshair, AlertCircle, Eye } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const CameraFeedMatrix: React.FC = () => {
  const { cameras, persons, alerts, selectedPersonId } = useSecurity();
  const [activeCamId, setActiveCamId] = useState<string>('CAM-021');
  const [isAiOverlayActive, setIsAiOverlayActive] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(30);
  const [latency, setLatency] = useState<number>(18);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeCam = cameras.find(c => c.camera_id === activeCamId) || cameras[0] || {
    camera_id: 'CAM-021',
    name: 'Executive Meeting Room A',
    building: 'Corporate Tower A',
    floor: 'Floor 2',
    room: 'Meeting Room',
    resolution: '4K UHD (3840x2160)',
    fps: 30,
    latency_ms: 18,
    status: 'Online'
  };

  // Render animated canvas simulated CCTV feed with dynamic AI bounding boxes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      // Dark futuristic room background simulation
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, width, height);

      // Floor grid perspective lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, height * 0.4);
        ctx.lineTo(i * 1.4 - width * 0.2, height);
        ctx.stroke();
      }

      // Simulated room furniture/architecture outlines
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(width * 0.25, height * 0.55, width * 0.5, height * 0.3);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeRect(width * 0.25, height * 0.55, width * 0.5, height * 0.3);

      // Simulated occupants with bounding boxes based on camera room
      const isMeetingRoom = activeCam.camera_id === 'CAM-021';
      const isServerRoom = activeCam.camera_id === 'CAM-019';

      // Person 1 (Primary - Rahul Sharma or simulated target)
      const p1X = width * (0.45 + Math.sin(time * 0.8) * 0.05);
      const p1Y = height * (0.42 + Math.cos(time * 0.6) * 0.02);
      const p1W = width * 0.16;
      const p1H = height * 0.44;

      // Draw silhouette
      ctx.fillStyle = isServerRoom ? '#ef444433' : '#38bdf833';
      ctx.beginPath();
      ctx.arc(p1X + p1W / 2, p1Y + p1H * 0.2, p1W * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(p1X + p1W * 0.2, p1Y + p1H * 0.35, p1W * 0.6, p1H * 0.6);

      if (isAiOverlayActive) {
        const isAlert = isServerRoom;
        const strokeColor = isAlert ? '#ef4444' : '#10b981';
        const tagBg = isAlert ? '#7f1d1d' : '#065f46';

        // Bounding box
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(p1X, p1Y, p1W, p1H);

        // Corner accents
        const cornerSize = 10;
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(p1X, p1Y + cornerSize); ctx.lineTo(p1X, p1Y); ctx.lineTo(p1X + cornerSize, p1Y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(p1X + p1W - cornerSize, p1Y); ctx.lineTo(p1X + p1W, p1Y); ctx.lineTo(p1X + p1W, p1Y + cornerSize);
        ctx.stroke();

        // Label Tag
        ctx.fillStyle = tagBg;
        ctx.fillRect(p1X, p1Y - 24, p1W, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Inter, sans-serif';
        const label = isAlert 
          ? '⚠ INTRUDER #941 [TRK-2025-000941]' 
          : '✓ Rahul Sharma [TRK-25-000567]';
        ctx.fillText(label, p1X + 4, p1Y - 9);

        // Subtag confidence
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(p1X, p1Y + p1H + 2, p1W, 16);
        ctx.fillStyle = strokeColor;
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`CONF: ${(98.2 + Math.sin(time)*0.8).toFixed(1)}% | YOLOv8x`, p1X + 4, p1Y + p1H + 13);
      }

      // Person 2 (Secondary attendee)
      if (isMeetingRoom) {
        const p2X = width * 0.2;
        const p2Y = height * 0.45;
        const p2W = width * 0.14;
        const p2H = height * 0.4;

        ctx.fillStyle = '#10b98122';
        ctx.fillRect(p2X, p2Y, p2W, p2H);

        if (isAiOverlayActive) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(p2X, p2Y, p2W, p2H);
          ctx.fillStyle = '#065f46';
          ctx.fillRect(p2X, p2Y - 20, p2W, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = '9px Inter, sans-serif';
          ctx.fillText('✓ Priya Singh [P-00214]', p2X + 4, p2Y - 7);
        }
      }

      // Camera HUD Scanlines and Timestamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameId);
  }, [activeCamId, isAiOverlayActive]);

  // Jitter FPS and Latency for realistic telemetry
  useEffect(() => {
    const intv = setInterval(() => {
      setFps(29 + Math.floor(Math.random() * 2));
      setLatency(16 + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(intv);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
      {/* Header & Stream Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>Live AI Optical Stream</span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE REC
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {activeCam.camera_id} • {activeCam.name} ({activeCam.floor})
            </p>
          </div>
        </div>

        {/* AI Overlay toggle & Camera Select */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAiOverlayActive(!isAiOverlayActive)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
              isAiOverlayActive
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAiOverlayActive ? 'AI Vision ON' : 'Raw Stream'}</span>
          </button>

          <select
            value={activeCamId}
            onChange={(e) => setActiveCamId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 font-mono"
          >
            {cameras.map(c => (
              <option key={c.camera_id} value={c.camera_id}>
                {c.camera_id}: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Video Stream Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-2xl">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {/* Top Left HUD Telemetry */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono space-y-0.5 text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="text-sky-400 font-bold">{activeCam.camera_id}</span>
            <span>|</span>
            <span className="text-emerald-400">{activeCam.resolution}</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <span>FPS: <strong className="text-slate-200">{fps}</strong></span>
            <span>•</span>
            <span>Latency: <strong className="text-slate-200">{latency}ms</strong></span>
            <span>•</span>
            <span>AI: <strong className="text-sky-300">YOLOv8 + DeepFace</strong></span>
          </div>
        </div>

        {/* Bottom Right Crosshair / Target Tag */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>AUTOTRACK: <strong className="text-emerald-400">LOCKED (10087)</strong></span>
        </div>
      </div>
    </div>
  );
};
