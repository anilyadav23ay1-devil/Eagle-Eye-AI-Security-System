import React, { useState } from 'react';
import { 
  X, Camera, Video, Link2, ShieldCheck, CheckCircle2, 
  AlertTriangle, RefreshCw, Radio, Sparkles, Cpu, Layers,
  Laptop, Smartphone, HelpCircle, Check, QrCode 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { CameraBrand, StreamType, CameraConnectPayload } from '../../types';

export const ConnectCameraModal: React.FC = () => {
  const { isConnectCamModalOpen, setIsConnectCamModalOpen, connectCamera, testCameraConnection, activeBuilding, activeFloor } = useSecurity();

  const [connectionMode, setConnectionMode] = useState<'laptop' | 'mobile' | 'enterprise'>('laptop');
  const [brand, setBrand] = useState<CameraBrand>('Local USB / Built-in Webcam');
  const [streamType, setStreamType] = useState<StreamType>('USB Local');
  const [name, setName] = useState<string>('Laptop Integrated Webcam');
  const [building, setBuilding] = useState<string>(activeBuilding || 'Corporate Tower A');
  const [floor, setFloor] = useState<string>(activeFloor || 'Floor 2');
  const [room, setRoom] = useState<string>('Server Room');
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.50');
  const [port, setPort] = useState<number>(8080);
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [channel, setChannel] = useState<number>(1);
  const [deviceIndex, setDeviceIndex] = useState<number>(0);
  const [customStreamUrl, setCustomStreamUrl] = useState<string>('');
  const [mobileAppType, setMobileAppType] = useState<'IP_WEBCAM' | 'DROIDCAM' | 'IRIUN'>('IP_WEBCAM');
  const [aiModels, setAiModels] = useState<string[]>(['YOLOv8', 'CentroidTracker', 'HUDAnnotator']);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number; resolution?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isConnectCamModalOpen) return null;

  const brands: { id: CameraBrand; name: string; defaultPort: number; type: StreamType }[] = [
    { id: 'Local USB / Built-in Webcam', name: 'Laptop / USB Webcam', defaultPort: 0, type: 'USB Local' },
    { id: 'Mobile IP Cam (DroidCam/IP Webcam)', name: 'Mobile Phone Camera', defaultPort: 8080, type: 'HTTP/MJPEG' },
    { id: 'Hikvision', name: 'Hikvision IP/NVR', defaultPort: 554, type: 'RTSP' },
    { id: 'Dahua', name: 'Dahua Technology', defaultPort: 554, type: 'RTSP' },
    { id: 'Axis', name: 'Axis Communications', defaultPort: 554, type: 'RTSP' },
    { id: 'CP Plus', name: 'CP Plus Orange / Coral', defaultPort: 554, type: 'RTSP' },
    { id: 'Reolink', name: 'Reolink IP Camera', defaultPort: 554, type: 'RTSP' },
    { id: 'Hanwha / Samsung', name: 'Hanwha Wisenet', defaultPort: 554, type: 'RTSP' },
    { id: 'Uniview', name: 'Uniview (UNV)', defaultPort: 554, type: 'RTSP' },
    { id: 'Amcrest', name: 'Amcrest ProHD', defaultPort: 554, type: 'RTSP' },
    { id: 'Generic RTSP', name: 'Generic RTSP / ONVIF', defaultPort: 554, type: 'RTSP' },
  ];

  const selectMode = (mode: 'laptop' | 'mobile' | 'enterprise') => {
    setConnectionMode(mode);
    setTestResult(null);
    if (mode === 'laptop') {
      setBrand('Local USB / Built-in Webcam');
      setStreamType('USB Local');
      setName('Laptop Integrated Webcam (Live Optical Node)');
      setDeviceIndex(0);
      setCustomStreamUrl('');
    } else if (mode === 'mobile') {
      setBrand('Mobile IP Cam (DroidCam/IP Webcam)');
      setStreamType('HTTP/MJPEG');
      setName('Mobile Optical Security Cam');
      setPort(8080);
      setCustomStreamUrl(`http://${ipAddress}:8080/video`);
    } else {
      setBrand('Hikvision');
      setStreamType('RTSP');
      setName('Main Corridor RTSP Stream');
      setPort(554);
      setCustomStreamUrl('');
    }
  };

  const handleMobileAppChange = (app: 'IP_WEBCAM' | 'DROIDCAM' | 'IRIUN') => {
    setMobileAppType(app);
    if (app === 'IP_WEBCAM') {
      setPort(8080);
      setCustomStreamUrl(`http://${ipAddress}:8080/video`);
    } else if (app === 'DROIDCAM') {
      setPort(4747);
      setCustomStreamUrl(`http://${ipAddress}:4747/video`);
    } else if (app === 'IRIUN') {
      setPort(8080);
      setCustomStreamUrl(`http://${ipAddress}:8080/video`);
    }
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Connect Real Optical Camera Node</h2>
              <p className="text-xs text-slate-400 font-mono">
                Laptop Webcams • Mobile Phone Cams • Hikvision • Dahua • RTSP / ONVIF
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

        {/* Quick Connection Preset Tabs */}
        <div className="px-6 pt-4 pb-2 bg-slate-900 grid grid-cols-3 gap-2 border-b border-slate-800">
          <button
            type="button"
            onClick={() => selectMode('laptop')}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              connectionMode === 'laptop'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md shadow-sky-500/10'
                : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Laptop Webcam</span>
          </button>

          <button
            type="button"
            onClick={() => selectMode('mobile')}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              connectionMode === 'mobile'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-md shadow-purple-500/10'
                : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Phone Cam</span>
          </button>

          <button
            type="button"
            onClick={() => selectMode('enterprise')}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              connectionMode === 'enterprise'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>IP / RTSP / NVR</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Laptop Webcam Mode */}
          {connectionMode === 'laptop' && (
            <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-sky-300">
                <Laptop className="w-4 h-4 text-sky-400" />
                <span>Laptop Integrated Optical Sensor (DirectShow / USB)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Uses the built-in webcam on your laptop or connected USB webcam. Video frames are processed in real time with AI bounding boxes and Centroid tracking.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Camera Device Index</label>
                  <select
                    value={deviceIndex}
                    onChange={(e) => setDeviceIndex(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value={0}>Device 0 (Integrated Laptop Webcam)</option>
                    <option value={1}>Device 1 (External USB Webcam)</option>
                    <option value={2}>Device 2 (Secondary USB Camera)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Stream Resolution</label>
                  <input
                    type="text"
                    disabled
                    value="1080p Full HD @ 30 FPS"
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Phone Camera Mode */}
          {connectionMode === 'mobile' && (
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Use Any Smartphone as a Wireless AI Security Camera</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Android & iOS
                </span>
              </div>

              {/* Mobile App Selectors */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleMobileAppChange('IP_WEBCAM')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    mobileAppType === 'IP_WEBCAM' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  IP Webcam App (Port 8080)
                </button>
                <button
                  type="button"
                  onClick={() => handleMobileAppChange('DROIDCAM')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    mobileAppType === 'DROIDCAM' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  DroidCam App (Port 4747)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Phone Wi-Fi IP Address</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => {
                      setIpAddress(e.target.value);
                      setCustomStreamUrl(`http://${e.target.value}:${port}/video`);
                    }}
                    placeholder="e.g. 192.168.1.50"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => {
                      const p = parseInt(e.target.value) || 8080;
                      setPort(p);
                      setCustomStreamUrl(`http://${ipAddress}:${p}/video`);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Resolved Stream URL</label>
                <input
                  type="text"
                  value={customStreamUrl}
                  onChange={(e) => setCustomStreamUrl(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300">Quick Mobile Phone Setup:</div>
                <p>1. Connect your phone and laptop to the same Wi-Fi network.</p>
                <p>2. Open <strong>IP Webcam</strong> or <strong>DroidCam</strong> on your phone and tap "Start Server".</p>
                <p>3. Type the IP shown on your phone into the box above and click <strong>Test Connection</strong>!</p>
              </div>
            </div>
          )}

          {/* Enterprise IP / RTSP / NVR Mode */}
          {connectionMode === 'enterprise' && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Manufacturer Brand Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {brands.slice(2).map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => { setBrand(b.id); setStreamType(b.type); setPort(b.defaultPort); }}
                      className={`p-2 rounded-xl border text-left text-xs font-semibold ${
                        brand === b.id ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <div className="truncate">{b.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Camera IP Address / Host</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value) || 554)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Channel No.</label>
                  <input
                    type="number"
                    value={channel}
                    onChange={(e) => setChannel(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Node Metadata & Room Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Camera Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Laptop Integrated Webcam"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Room / Zone Assignment</label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
              >
                <option value="Server Room">Floor 2 - Server Room (Restricted)</option>
                <option value="Meeting Room">Floor 2 - Meeting Room</option>
                <option value="Office 201">Floor 2 - Office 201</option>
                <option value="Office 202">Floor 2 - Office 202</option>
                <option value="Main Entrance">Floor 1 - Main Entrance Gate</option>
                <option value="Reception">Floor 1 - Reception Desk</option>
                <option value="Corridor">Floor 2 - North Corridor</option>
              </select>
            </div>
          </div>

          {/* Test & Submit Footer Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
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
                <span>{isSubmitting ? 'Starting Feed...' : 'Connect Real Camera'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
