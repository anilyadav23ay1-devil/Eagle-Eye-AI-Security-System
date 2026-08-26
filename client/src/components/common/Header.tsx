import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Eye, Bell, Volume2, VolumeX, 
  Lock, AlertTriangle, UserPlus, Radio, Activity, RefreshCw,
  Database, Cpu, CheckCircle2, Laptop 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const Header: React.FC = () => {
  const { 
    stats, soundEnabled, toggleSound, isLockdownMode, 
    toggleLockdown, triggerUnknownPersonPrompt, isConnected,
    simulateAlert, setIsConnectCamModalOpen, connectLaptopWebcam
  } = useSecurity();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showSimMenu, setShowSimMenu] = useState<boolean>(false);
  const [webcamFeedback, setWebcamFeedback] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickWebcam = async () => {
    try {
      setWebcamFeedback('Connecting Webcam...');
      await connectLaptopWebcam(0, 'Server Room');
      setWebcamFeedback('Webcam Live!');
      setTimeout(() => setWebcamFeedback(null), 3000);
    } catch (e) {
      setWebcamFeedback('Webcam Error');
      setTimeout(() => setWebcamFeedback(null), 3000);
    }
  };

  return (
    <header className={`h-16 px-5 border-b z-40 transition-colors duration-300 flex items-center justify-between ${
      isLockdownMode 
        ? 'bg-red-950/80 border-red-600 shadow-lg shadow-red-900/40' 
        : 'bg-cyber-dark/95 border-cyber-border backdrop-blur-md'
    }`}>
      {/* Brand & Live Status Badges */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 border border-sky-400/30">
            <Eye className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-base tracking-wider text-white flex items-center gap-1.5">
                EAGLE EYE <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-normal">REAL AI CORE</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">AI Security & Activity Intelligence Platform</p>
          </div>
        </div>

        {/* Live Engine & Database Status Badges */}
        <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-slate-800">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLockdownMode ? 'bg-red-400' : isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isLockdownMode ? 'bg-red-500' : isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-300">
              {isLockdownMode ? 'LOCKDOWN ACTIVE' : isConnected ? 'AI CORE: LIVE' : 'CONNECTING...'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <Database className="w-3 h-3 text-sky-400" />
            <span className="text-[11px] font-mono text-slate-300">SQLite DB: Synced</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2.5">
        {/* 1-Click Laptop Webcam Trigger */}
        <button
          onClick={handleQuickWebcam}
          title="Connect Built-in Laptop Webcam for Live Testing"
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-all"
        >
          <Laptop className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">{webcamFeedback || 'Laptop Cam'}</span>
        </button>

        {/* Real-time Clock */}
        <div className="hidden md:flex flex-col items-end pr-2.5 border-r border-slate-800 font-mono">
          <span className="text-xs font-bold text-sky-400 tracking-wider">{currentTime}</span>
          <span className="text-[9px] text-slate-400">{currentDate}</span>
        </div>

        {/* Test Security Rules Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowSimMenu(!showSimMenu)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Test Rules</span>
          </button>

          {showSimMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-xs space-y-1">
              <div className="px-2 py-1 font-semibold text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                Trigger Real-Time AI Rule Test:
              </div>
              <button 
                onClick={() => { simulateAlert('Unauthorized Access', 'Server Room'); setShowSimMenu(false); }}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-red-950/60 text-red-300 flex items-center space-x-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Server Room Intrusion (Critical)</span>
              </button>
              <button 
                onClick={() => { simulateAlert('Tailgating Detected', 'Main Entrance'); setShowSimMenu(false); }}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-amber-950/60 text-amber-300 flex items-center space-x-2"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Tailgating at Turnstile (High)</span>
              </button>
              <button 
                onClick={() => { simulateAlert('Loitering Detected', 'Corridor North'); setShowSimMenu(false); }}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center space-x-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Loitering in Corridor (Medium)</span>
              </button>
              <button 
                onClick={() => { triggerUnknownPersonPrompt(); setShowSimMenu(false); }}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-purple-950/60 text-purple-300 flex items-center space-x-2 border-t border-slate-800 mt-1"
              >
                <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>Simulate Unknown Person Entry</span>
              </button>
            </div>
          )}
        </div>

        {/* Connect Real Camera Button */}
        <button
          onClick={() => setIsConnectCamModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all"
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Connect Cam</span>
        </button>

        {/* Enroll Button */}
        <button
          onClick={() => triggerUnknownPersonPrompt()}
          className="px-3 py-1.5 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-sky-600/20 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Enroll Visitor</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? "Mute Security Chimes" : "Enable Security Chimes"}
          className={`p-2 rounded-xl border transition-all ${
            soundEnabled 
              ? 'bg-slate-900 text-sky-400 border-slate-800 hover:bg-slate-850' 
              : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Emergency Facility Lockdown Toggle */}
        <button
          onClick={toggleLockdown}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-all ${
            isLockdownMode
              ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/50 animate-pulse'
              : 'bg-red-950/40 text-red-400 border-red-800/60 hover:bg-red-900/50'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isLockdownMode ? 'CANCEL LOCKDOWN' : 'LOCKDOWN'}</span>
        </button>
      </div>
    </header>
  );
};
