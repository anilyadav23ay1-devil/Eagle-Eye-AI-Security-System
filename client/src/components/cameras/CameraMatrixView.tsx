import React, { useState } from 'react';
import { 
  Camera as CameraIcon, Video, Link2, Unlink, Plus, Trash2, 
  CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Power 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { Camera } from '../../types';

export const CameraMatrixView: React.FC = () => {
  const { 
    cameras, stats, setIsConnectCamModalOpen, 
    disconnectCamera, reconnectCamera, deleteCamera, setSelectedCameraId 
  } = useSecurity();

  const [filter, setFilter] = useState<'all' | 'connected' | 'real' | 'disconnected'>('all');
  const [activePreviewCamId, setActivePreviewCamId] = useState<string | null>(null);

  const filteredCameras = cameras.filter(cam => {
    if (filter === 'connected') return cam.connection_status === 'Connected';
    if (filter === 'disconnected') return cam.connection_status === 'Disconnected';
    if (filter === 'real') return cam.is_real_camera;
    return true;
  });

  const handleToggleConnection = async (cam: Camera) => {
    if (cam.connection_status === 'Connected') {
      await disconnectCamera(cam.camera_id);
    } else {
      await reconnectCamera(cam.camera_id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <CameraIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Universal Camera Ingestion & Stream Matrix</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {cameras.filter(c => c.connection_status === 'Connected').length} / {cameras.length} Active Nodes
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Hikvision • Dahua • Axis • CP Plus • Reolink • RTSP • ONVIF • USB Webcams
            </p>
          </div>
        </div>

        {/* Add Real Camera Button & Filters */}
        <div className="flex items-center space-x-3">
          {/* Filters */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({cameras.length})
            </button>
            <button
              onClick={() => setFilter('real')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === 'real' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Real Cameras ({cameras.filter(c => c.is_real_camera).length})
            </button>
            <button
              onClick={() => setFilter('connected')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === 'connected' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Connected
            </button>
            <button
              onClick={() => setFilter('disconnected')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === 'disconnected' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Disconnected
            </button>
          </div>

          <button
            onClick={() => setIsConnectCamModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Real Camera</span>
          </button>
        </div>
      </div>

      {/* Camera Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCameras.map((cam) => {
          const isConnected = cam.connection_status === 'Connected';
          const isConnecting = cam.connection_status === 'Connecting';

          return (
            <div
              key={cam.camera_id}
              className={`glass-panel rounded-2xl p-4 border transition-all space-y-3 ${
                isConnected
                  ? 'border-slate-800 hover:border-sky-500/60'
                  : 'border-red-900/40 bg-red-950/20 opacity-80'
              }`}
            >
              {/* Card Top: Name, Brand Pill, ID */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-red-500'
                    }`} />
                    <h3 className="font-bold text-xs text-white truncate max-w-[170px]" title={cam.name}>
                      {cam.name}
                    </h3>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                    <span className="font-bold text-sky-400">{cam.camera_id}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {cam.brand}
                    </span>
                  </div>
                </div>

                {/* Connect / Disconnect Toggle Button */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggleConnection(cam)}
                    title={isConnected ? 'Disconnect Camera Stream' : 'Connect Camera Stream'}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1 border transition-all ${
                      isConnected
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50 hover:bg-red-950 hover:text-red-300 hover:border-red-600'
                        : isConnecting
                        ? 'bg-amber-950 text-amber-300 border-amber-600'
                        : 'bg-red-950/60 text-red-300 border-red-600/50 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-600'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{isConnected ? 'ONLINE' : isConnecting ? 'CONNECTING...' : 'DISCONNECTED'}</span>
                  </button>

                  <button
                    onClick={() => deleteCamera(cam.camera_id)}
                    title="Remove Camera"
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stream Frame Preview (Live Video Stream from backend) */}
              <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden group">
                {isConnected ? (
                  <img
                    src={`http://localhost:8000/api/cameras/${cam.camera_id}/live-feed`}
                    alt={cam.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to static background if streaming endpoint is paused
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-1">
                    <Unlink className="w-8 h-8 text-slate-700" />
                    <span className="text-[11px] font-mono">Stream Disconnected</span>
                  </div>
                )}

                {/* Overlaid Badges */}
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 backdrop-blur-sm">
                  {cam.floor} • {cam.room}
                </div>

                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 backdrop-blur-sm">
                  {cam.fps} FPS • {cam.resolution.split(' ')[0]}
                </div>
              </div>

              {/* Technical Specifications Bar */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Stream Type:</span>
                  <span className="text-slate-200 font-bold">{cam.stream_type}</span>
                </div>
                {cam.stream_url && (
                  <div className="flex justify-between text-[10px] text-slate-400 truncate">
                    <span>Source:</span>
                    <span className="text-sky-400 truncate max-w-[200px]" title={cam.stream_url}>
                      {cam.stream_url}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>AI Models:</span>
                  <span className="text-emerald-400">{cam.ai_models.join(' • ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
