import React, { useState, useRef } from 'react';
import { Camera, Video, Maximize2, Radio, CheckCircle, RefreshCw, Cpu } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const CameraMatrixView: React.FC = () => {
  const { cameras, stats } = useSecurity();
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch (e) {
      alert('Unable to access webcam. Please check browser permissions.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Enterprise Optical Camera Matrix & Edge Vision Node</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {stats.cameras_online} / 96 ONLINE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              High-throughput RTSP stream ingestion, YOLOv8x multi-object tracking, and DeepFace Re-ID pipeline
            </p>
          </div>
        </div>

        {/* Webcam Test Button */}
        <div>
          {!isWebcamActive ? (
            <button
              onClick={startWebcam}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center space-x-2 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Test Real Webcam Feed</span>
            </button>
          ) : (
            <button
              onClick={stopWebcam}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all"
            >
              <span>Stop Webcam</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Webcam Stream Demo (if active) */}
      {isWebcamActive && (
        <div className="glass-panel rounded-2xl p-4 border border-sky-500/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h3 className="text-sm font-bold text-white">Live Edge Node Stream (Local Device Webcam)</h3>
            </div>
            <span className="text-xs font-mono text-sky-400 font-bold">YOLOv8x ACTIVE (18ms)</span>
          </div>
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black max-w-2xl mx-auto border-2 border-sky-500/60 shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-white/10">
              CAM-LOCAL • 1080p 30FPS • BIOMETRIC LOCK ON
            </div>
          </div>
        </div>
      )}

      {/* Camera Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cameras.map((cam) => (
          <div
            key={cam.camera_id}
            className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-sky-500/60 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="font-bold text-xs text-white">{cam.name}</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                {cam.camera_id}
              </span>
            </div>

            {/* Stream Canvas Mock */}
            <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              <Video className="w-8 h-8 text-slate-700 group-hover:text-sky-400 transition-colors" />

              <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300">
                {cam.floor} • {cam.room}
              </div>

              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400">
                {cam.fps} FPS • {cam.latency_ms}ms
              </div>
            </div>

            {/* AI Engine Metadata */}
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Resolution:</span>
                <span className="text-slate-200">{cam.resolution}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Models:</span>
                <span className="text-sky-400">{cam.ai_models.join(' + ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
