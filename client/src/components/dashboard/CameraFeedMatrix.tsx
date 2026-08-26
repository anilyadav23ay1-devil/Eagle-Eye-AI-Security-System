import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, Radio, Video, Layers, Crosshair, AlertCircle, Eye, RefreshCw, UserPlus, Sparkles } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const CameraFeedMatrix: React.FC = () => {
  const { 
    cameras, selectedCameraId, setSelectedCameraId, 
    triggerUnknownPersonPrompt, isConnected 
  } = useSecurity();

  const [isAiOverlayActive, setIsAiOverlayActive] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [imgKey, setImgKey] = useState<number>(Date.now());
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Active camera selection
  const activeCam = cameras.find(c => c.camera_id === selectedCameraId) || cameras[0] || {
    camera_id: 'CAM-021',
    name: 'Executive Meeting Room A',
    building: 'Corporate Tower A',
    floor: 'Floor 2',
    room: 'Meeting Room',
    resolution: '1080p Full HD',
    fps: 30,
    latency_ms: 18,
    status: 'Online',
    is_real_camera: false
  };

  useEffect(() => {
    setStreamError(false);
    setImgKey(Date.now());
  }, [selectedCameraId]);

  const handleRefreshStream = () => {
    setStreamError(false);
    setImgKey(Date.now());
  };

  const handleCaptureAndEnroll = async () => {
    setIsCapturing(true);
    try {
      // Trigger instant enrollment with photo capture
      triggerUnknownPersonPrompt();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapturing(false);
    }
  };

  const liveStreamUrl = `http://localhost:8000/api/cameras/${activeCam.camera_id}/live-feed?t=${imgKey}`;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3 shadow-2xl">
      {/* Header & Stream Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>Live AI Optical Stream</span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE OPTICAL REC
              </span>
              {activeCam.is_real_camera && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REAL HARDWARE FEED
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {activeCam.camera_id} • {activeCam.name} ({activeCam.floor} - {activeCam.room})
            </p>
          </div>
        </div>

        {/* Stream Actions & Camera Switcher Dropdown */}
        <div className="flex items-center space-x-2">
          {/* Capture Face & Register Button */}
          <button
            onClick={handleCaptureAndEnroll}
            disabled={isCapturing}
            title="Capture Face & Enroll Target"
            className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Capture & Enroll</span>
          </button>

          {/* Refresh Stream Button */}
          <button
            onClick={handleRefreshStream}
            title="Reload Video Stream"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Camera Select Dropdown */}
          <select
            value={activeCam.camera_id}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono shadow-sm"
          >
            {cameras.map(c => (
              <option key={c.camera_id} value={c.camera_id}>
                {c.camera_id}: {c.name} {c.is_real_camera ? '★ [REAL]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real Live MJPEG Video Stream Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-2xl flex items-center justify-center">
        {!streamError ? (
          <img
            key={imgKey}
            src={liveStreamUrl}
            alt={`Live Optical Feed - ${activeCam.name}`}
            onError={() => setStreamError(true)}
            className="w-full h-full object-cover select-none"
          />
        ) : (
          <div className="p-8 text-center space-y-3 text-slate-400">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
            <div className="font-bold text-sm text-slate-200">Connecting to Optical Stream...</div>
            <p className="text-xs max-w-sm mx-auto">
              Waiting for video packets from {activeCam.camera_id} ({activeCam.brand}).
            </p>
            <button
              onClick={handleRefreshStream}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Top Left HUD Telemetry Overlay */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono space-y-0.5 text-slate-300 pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className="text-sky-400 font-bold">{activeCam.camera_id}</span>
            <span>|</span>
            <span className="text-emerald-400">{activeCam.resolution || '1080p Full HD'}</span>
            <span>|</span>
            <span className="text-purple-300">{activeCam.brand}</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <span>FPS: <strong className="text-slate-200">{activeCam.fps || 30}</strong></span>
            <span>•</span>
            <span>Latency: <strong className="text-slate-200">{activeCam.latency_ms || 18}ms</strong></span>
            <span>•</span>
            <span>AI: <strong className="text-sky-300">YOLOv8 + CentroidTracker</strong></span>
          </div>
        </div>

        {/* Bottom Right AI Tracking Status Badge */}
        <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-slate-300 flex items-center space-x-2 pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>AI OPTICAL AUTOTRACK: <strong className="text-emerald-400">ENGAGED</strong></span>
        </div>
      </div>
    </div>
  );
};
