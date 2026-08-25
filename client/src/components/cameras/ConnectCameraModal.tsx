import React, { useState } from 'react';
import { 
  X, Camera, Video, Link2, ShieldCheck, CheckCircle2, 
  AlertTriangle, RefreshCw, Radio, Sparkles, Cpu, Layers 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { CameraBrand, StreamType, CameraConnectPayload } from '../../types';

export const ConnectCameraModal: React.FC = () => {
  const { isConnectCamModalOpen, setIsConnectCamModalOpen, connectCamera, testCameraConnection } = useSecurity();

  const [brand, setBrand] = useState<CameraBrand>('Hikvision');
  const [streamType, setStreamType] = useState<StreamType>('RTSP');
  const [name, setName] = useState<string>('Main Entrance AI Stream 1');
  const [building, setBuilding] = useState<string>('Corporate Tower A');
  const [floor, setFloor] = useState<string>('Floor 2');
  const [room, setRoom] = useState<string>('Meeting Room');
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.120');
  const [port, setPort] = useState<number>(554);
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [channel, setChannel] = useState<number>(1);
  const [deviceIndex, setDeviceIndex] = useState<number>(0);
  const [customStreamUrl, setCustomStreamUrl] = useState<string>('');
  const [aiModels, setAiModels] = useState<string[]>(['YOLOv8', 'DeepFace', 'ByteTrack']);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number; resolution?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isConnectCamModalOpen) return null;

  const brands: { id: CameraBrand; name: string; defaultPort: number; type: StreamType }[] = [
    { id: 'Hikvision', name: 'Hikvision (IP / NVR)', defaultPort: 554, type: 'RTSP' },
    { id: 'Dahua', name: 'Dahua Technology', defaultPort: 554, type: 'RTSP' },
    { id: 'Axis', name: 'Axis Communications', defaultPort: 554, type: 'RTSP' },
    { id: 'CP Plus', name: 'CP Plus Orange / Coral', defaultPort: 554, type: 'RTSP' },
    { id: 'Reolink', name: 'Reolink IP Camera', defaultPort: 554, type: 'RTSP' },
    { id: 'Hanwha / Samsung', name: 'Hanwha Wisenet', defaultPort: 554, type: 'RTSP' },
    { id: 'Uniview', name: 'Uniview (UNV)', defaultPort: 554, type: 'RTSP' },
    { id: 'Amcrest', name: 'Amcrest ProHD', defaultPort: 554, type: 'RTSP' },
    { id: 'Mobile IP Cam (DroidCam/IP Webcam)', name: 'Mobile Phone IP Cam (DroidCam / IP Webcam)', defaultPort: 8080, type: 'HTTP/MJPEG' },
    { id: 'Local USB / Built-in Webcam', name: 'Local USB / Integrated Webcam', defaultPort: 0, type: 'USB Local' },
    { id: 'Generic RTSP', name: 'Generic RTSP / ONVIF Stream', defaultPort: 554, type: 'RTSP' },
  ];

  const handleBrandChange = (newBrand: CameraBrand) => {
    setBrand(newBrand);
    const found = brands.find(b => b.id === newBrand);
    if (found) {
      setStreamType(found.type);
      setPort(found.defaultPort);
      if (found.type === 'USB Local') {
        setName('Local USB Optical Node');
      } else if (found.type === 'HTTP/MJPEG') {
        setName('Mobile Optical Video Feed');
      }
    }
    setTestResult(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const payload = {
      brand,
      stream_type: streamType,
      stream_url: customStreamUrl || undefined,
      ip_address: ipAddress,
      port,
      username,
      password,
      channel,
      device_index: deviceIndex
    };

    const res = await testCameraConnection(payload);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: CameraConnectPayload = {
      name,
      building,
      floor,
      room,
      brand,
      stream_type: streamType,
      stream_url: customStreamUrl || undefined,
      ip_address: ipAddress,
      port,
      username,
      password,
      channel,
      device_index: deviceIndex,
      ai_models: aiModels,
    };

    try {
      await connectCamera(payload);
      setIsSubmitting(false);
      setIsConnectCamModalOpen(false);
    } catch (e) {
      setIsSubmitting(false);
      alert('Failed to connect to camera. Check configuration parameters.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Connect Real Optical Camera Node</h2>
              <p className="text-xs text-slate-400 font-mono">
                Support for RTSP, ONVIF, HTTP/MJPEG, and DirectShow USB Devices
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConnectCamModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Brand Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Camera Manufacturer / Protocol Preset</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {brands.map((b) => {
                const isSelected = brand === b.id;
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => handleBrandChange(b.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md shadow-sky-500/10'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="truncate">{b.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{b.type}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connection Parameters Grid */}
          {streamType === 'USB Local' ? (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-slate-200">Local DirectShow / USB Webcam Configuration</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Device Index</label>
                  <select
                    value={deviceIndex}
                    onChange={(e) => setDeviceIndex(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value={0}>Camera Device Index 0 (Default / Integrated)</option>
                    <option value={1}>Camera Device Index 1 (External USB)</option>
                    <option value={2}>Camera Device Index 2 (Secondary USB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Optical Frame Resolution</label>
                  <input
                    type="text"
                    disabled
                    value="1080p (1920x1080) @ 30 FPS"
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Network Stream Credentials & RTSP Path</span>
                <span className="text-[10px] text-sky-400 font-mono">{streamType} Protocol</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Camera IP Address / Host</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="e.g. 192.168.1.100"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value) || 554)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Channel No.</label>
                  <input
                    type="number"
                    value={channel}
                    onChange={(e) => setChannel(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Custom RTSP / HTTP URL Override (Optional)
                </label>
                <input
                  type="text"
                  value={customStreamUrl}
                  onChange={(e) => setCustomStreamUrl(e.target.value)}
                  placeholder="Leave empty to auto-generate from brand template or paste full rtsp:// URL"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* Node Metadata & Location Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Camera Node Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Server Room Vault Cam 1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Room / Zone Assignment</label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="Main Entrance">Floor 1 - Main Entrance Gate</option>
                <option value="Reception">Floor 1 - Reception Desk</option>
                <option value="Meeting Room">Floor 2 - Executive Meeting Room A</option>
                <option value="Office 201">Floor 2 - Office 201</option>
                <option value="Office 202">Floor 2 - Office 202</option>
                <option value="Server Room">Floor 2 - Server Room (Restricted)</option>
                <option value="Corridor">Floor 2 - North Corridor</option>
                <option value="Lift Lobby">Floor 2 - Elevator Lobby</option>
              </select>
            </div>
          </div>

          {/* Test Stream Connection Feedback */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing Stream Ping...' : 'Test Connection'}</span>
              </button>

              {testResult && (
                <div className={`text-xs font-mono flex items-center gap-1.5 ${testResult.success ? 'text-emerald-400 font-bold' : 'text-red-400'}`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                  {testResult.latency_ms && <span>({testResult.latency_ms}ms)</span>}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsConnectCamModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center space-x-2 transition-all"
              >
                <Link2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Initializing Stream...' : 'Connect Real Camera'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
