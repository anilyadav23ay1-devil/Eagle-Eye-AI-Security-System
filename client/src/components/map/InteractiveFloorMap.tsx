import React, { useState } from 'react';
import { 
  Building, Layers, ZoomIn, ZoomOut, RotateCcw, 
  Eye, ShieldAlert, Camera, Users, Lock, ChevronDown, PenTool, UploadCloud 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { RoomZone, Person } from '../../types';
import { RoomDetailsDrawer } from './RoomDetailsDrawer';

interface InteractiveFloorMapProps {
  onSelectPerson?: (personId: string) => void;
  onOpenStudio?: () => void;
}

export const InteractiveFloorMap: React.FC<InteractiveFloorMapProps> = ({ 
  onSelectPerson, 
  onOpenStudio 
}) => {
  const { 
    persons, rooms, cameras, activeFloor, setActiveFloor, 
    activeBuilding, setActiveBuilding, selectedPersonId, setSelectedPersonId,
    selectedRoom, setSelectedRoomId, setSelectedCameraId, buildings
  } = useSecurity();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterType, setFilterType] = useState<string>('all');

  const currentBldg = buildings.find(b => b.name === activeBuilding) || buildings[0];
  const currentFloors = currentBldg?.floors || [];
  const currentFloorObj = currentFloors.find(f => f.floor_name === activeFloor) || currentFloors[0];

  const filteredPersons = persons.filter(p => {
    if (filterType === 'authorized') return p.status === 'Authorized';
    if (filterType === 'alert') return p.status === 'Alert';
    if (filterType === 'visitor') return p.role === 'Visitor';
    return true;
  });

  const handleRoomClick = (room: RoomZone) => {
    setSelectedRoomId(room.id);
  };

  const handlePersonClick = (e: React.MouseEvent, p: Person) => {
    e.stopPropagation();
    setSelectedPersonId(p.person_id);
    if (onSelectPerson) onSelectPerson(p.person_id);
  };

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Building and Floor Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Facility:</span>
            <select
              value={activeBuilding}
              onChange={(e) => setActiveBuilding(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500 font-semibold"
            >
              {buildings.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <span className="text-xs text-slate-400 font-semibold">Select Floor:</span>
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              {currentFloors.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFloor(f.floor_name)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeFloor === f.floor_name
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {f.floor_name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blueprint Designer Launcher & Map Tools */}
        <div className="flex items-center space-x-3">
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Blueprint CAD Studio / Upload</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium ${
                filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('authorized')}
              className={`px-2.5 py-1 rounded-lg font-medium ${
                filterType === 'authorized' ? 'bg-emerald-950 text-emerald-400' : 'text-slate-400'
              }`}
            >
              Authorized
            </button>
            <button
              onClick={() => setFilterType('alert')}
              className={`px-2.5 py-1 rounded-lg font-medium ${
                filterType === 'alert' ? 'bg-red-950 text-red-400' : 'text-slate-400'
              }`}
            >
              Alerts
            </button>
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-800 pl-3">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.7))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Floor Plan Canvas Container */}
      <div className="relative glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl min-h-[560px]">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        {/* Legend Overlay */}
        <div className="absolute top-6 left-6 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-700/80 shadow-lg text-xs space-y-1.5 font-medium">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Spatial Legend</div>
          <div className="flex items-center space-x-4 flex-wrap gap-y-1">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              <span>Authorized</span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              <span>Visitor</span>
            </span>
            <span className="flex items-center space-x-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>Alert / Breach</span>
            </span>
            <span className="flex items-center space-x-1.5 text-sky-400">
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Camera FOV</span>
            </span>
          </div>
        </div>

        {/* Map Blueprint Visual Frame */}
        <div 
          className="relative w-full h-[520px] transition-transform duration-300 ease-out flex items-center justify-center select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <div className="relative w-[900px] h-[480px] bg-slate-900/90 rounded-2xl border-2 border-slate-700 shadow-2xl p-4 overflow-hidden">
            {/* Uploaded Background Blueprint Image (if available) */}
            {currentFloorObj?.blueprint_url && (
              <img
                src={currentFloorObj.blueprint_url}
                alt="Background Blueprint"
                className="absolute inset-0 w-full h-full object-contain opacity-35 pointer-events-none"
              />
            )}

            {/* Render Architectural Rooms on Floor 2 */}
            {activeFloor === 'Floor 2' ? (
              <>
                {/* Office 201 */}
                <div
                  onClick={() => handleRoomClick({ id: 'room-201', name: 'Office 201', building: activeBuilding, floor: 'Floor 2', max_capacity: 10, current_occupancy: 4, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: ['P-00214'], x: 5, y: 5, width: 38, height: 38 })}
                  className="absolute top-4 left-4 w-[320px] h-[190px] rounded-xl border border-slate-700/90 bg-slate-850/60 hover:bg-slate-800/80 hover:border-sky-500/70 transition-all cursor-pointer p-3 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono text-slate-300">OFFICE 201</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">4 People</span>
                  </div>
                  <div className="flex items-center justify-end text-[10px] text-slate-500 font-mono">
                    Click for telemetry
                  </div>
                </div>

                {/* Office 202 */}
                <div
                  onClick={() => handleRoomClick({ id: 'room-202', name: 'Office 202', building: activeBuilding, floor: 'Floor 2', max_capacity: 8, current_occupancy: 2, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: [], x: 57, y: 5, width: 38, height: 28 })}
                  className="absolute top-4 right-4 w-[320px] h-[120px] rounded-xl border border-slate-700/90 bg-slate-850/60 hover:bg-slate-800/80 hover:border-sky-500/70 transition-all cursor-pointer p-3 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono text-slate-300">OFFICE 202</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">2 People</span>
                  </div>
                </div>

                {/* Meeting Room */}
                <div
                  onClick={() => handleRoomClick({ id: 'room-meeting', name: 'Meeting Room', building: activeBuilding, floor: 'Floor 2', max_capacity: 16, current_occupancy: 8, is_restricted: false, allowed_roles: ['Employee', 'Visitor', 'VIP'], occupants: ['P-10087'], x: 57, y: 35, width: 38, height: 32 })}
                  className="absolute top-[140px] right-4 w-[320px] h-[160px] rounded-xl border border-sky-500/40 bg-sky-950/20 hover:bg-sky-950/40 hover:border-sky-400 transition-all cursor-pointer p-3 flex flex-col justify-between shadow-inner"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold font-mono text-sky-300">MEETING ROOM</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">PRIMARY</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700">8 People</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Session: AI Architecture Review
                  </div>
                </div>

                {/* Server Room */}
                <div
                  onClick={() => handleRoomClick({ id: 'room-server', name: 'Server Room', building: activeBuilding, floor: 'Floor 2', max_capacity: 4, current_occupancy: 3, is_restricted: true, allowed_roles: ['Security', 'Employee'], occupants: ['P-00182', 'P-UNKNOWN-1'], x: 5, y: 58, width: 38, height: 37 })}
                  className="absolute bottom-4 left-4 w-[320px] h-[190px] rounded-xl border border-red-500/60 bg-red-950/30 hover:bg-red-950/50 hover:border-red-400 transition-all cursor-pointer p-3 flex flex-col justify-between shadow-lg shadow-red-950/20"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold font-mono text-red-400">SERVER ROOM</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> RESTRICTED
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700">3 People</span>
                  </div>
                  <div className="text-[10px] text-red-400 font-mono animate-pulse">
                    ⚠ Active Breach Alert (Intruder #941)
                  </div>
                </div>

                {/* Central Corridor */}
                <div className="absolute top-4 left-[350px] w-[180px] h-[440px] rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 p-2 flex flex-col justify-between items-center text-center">
                  <span className="text-[11px] font-mono text-slate-500 tracking-widest uppercase">CORRIDOR</span>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono">7 in transit</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600">NORTH-SOUTH SPINE</span>
                </div>

                {/* Elevator Lobby & Pantry */}
                <div className="absolute bottom-4 right-4 w-[320px] h-[110px] flex space-x-2">
                  <div
                    onClick={() => handleRoomClick({ id: 'room-lift', name: 'Lift Lobby', building: activeBuilding, floor: 'Floor 2', max_capacity: 20, current_occupancy: 2, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: ['P-00305'], x: 57, y: 69, width: 22, height: 26 })}
                    className="flex-1 rounded-xl border border-slate-700/90 bg-slate-850/60 hover:bg-slate-800 p-2 flex flex-col justify-between cursor-pointer"
                  >
                    <span className="text-[11px] font-bold font-mono text-slate-300">ELEVATOR LOBBY</span>
                    <span className="text-[10px] font-mono text-slate-400">2 People</span>
                  </div>
                  <div
                    onClick={() => handleRoomClick({ id: 'room-pantry', name: 'Pantry', building: activeBuilding, floor: 'Floor 2', max_capacity: 10, current_occupancy: 1, is_restricted: false, allowed_roles: ['Employee', 'Visitor'], occupants: [], x: 80, y: 69, width: 15, height: 26 })}
                    className="w-24 rounded-xl border border-slate-700/90 bg-slate-850/60 hover:bg-slate-800 p-2 flex flex-col justify-between cursor-pointer"
                  >
                    <span className="text-[11px] font-bold font-mono text-slate-300">PANTRY</span>
                    <span className="text-[10px] font-mono text-slate-400">1 Person</span>
                  </div>
                </div>
              </>
            ) : (
              /* Dynamically rendered drawn rooms on other floors */
              <div className="w-full h-full relative">
                {currentFloorObj?.rooms && currentFloorObj.rooms.length > 0 ? (
                  currentFloorObj.rooms.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleRoomClick(r)}
                      className={`absolute rounded-xl border p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                        r.is_restricted 
                          ? 'border-red-500/60 bg-red-950/30' 
                          : 'border-sky-500/40 bg-sky-950/20'
                      }`}
                      style={{
                        left: `${r.x}%`,
                        top: `${r.y}%`,
                        width: `${r.width}%`,
                        height: `${r.height}%`
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold font-mono text-white">{r.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          {r.current_occupancy} / {r.max_capacity}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                    <PenTool className="w-12 h-12 text-slate-700 animate-bounce" />
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-slate-300">No Blueprint Drawn for {activeFloor}</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Use the built-in Blueprint CAD Studio to draw custom rooms or upload a PDF/Image blueprint for this level.
                      </p>
                    </div>
                    {onOpenStudio && (
                      <button
                        onClick={onOpenStudio}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                      >
                        Open Blueprint Studio
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cameras with Visual FOV Cones */}
            {cameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => setSelectedCameraId(cam.camera_id)}
                className="absolute z-20 cursor-pointer group"
                style={{ left: `${cam.x_pos}%`, top: `${cam.y_pos}%`, transform: 'translate(-50%, -50%)' }}
                title={`${cam.camera_id}: ${cam.name}`}
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-sky-400/60 flex items-center justify-center text-sky-400 group-hover:scale-125 transition-transform shadow-md shadow-sky-500/20">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] font-mono px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap z-30">
                    {cam.camera_id} ({cam.fps} FPS)
                  </div>
                </div>
              </div>
            ))}

            {/* Moving Person Avatars */}
            {filteredPersons.map((p) => {
              const isSelected = p.person_id === selectedPersonId;
              const isAlert = p.status === 'Alert';
              const isVisitor = p.role === 'Visitor';

              return (
                <div
                  key={p.person_id}
                  onClick={(e) => handlePersonClick(e, p)}
                  className={`absolute z-30 cursor-pointer transition-all duration-700 ease-out group ${
                    isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                  }`}
                  style={{ left: `${p.x_pos}%`, top: `${p.y_pos}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="relative flex flex-col items-center">
                    {isAlert ? (
                      <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-500 opacity-75" />
                    ) : isSelected ? (
                      <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-60" />
                    ) : null}

                    <div className={`w-8 h-8 rounded-full overflow-hidden border-2 shadow-lg ${
                      isAlert 
                        ? 'border-red-500 shadow-red-500/50' 
                        : isVisitor 
                        ? 'border-amber-400 shadow-amber-400/40' 
                        : 'border-emerald-400 shadow-emerald-400/40'
                    }`}>
                      <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                    </div>

                    <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap font-mono shadow-md ${
                      isSelected
                        ? 'bg-sky-500 text-white'
                        : isAlert
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-900/90 text-slate-200 border border-slate-700'
                    }`}>
                      {p.name.split(' ')[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <RoomDetailsDrawer
        room={selectedRoom}
        onClose={() => setSelectedRoomId(null)}
        onSelectPerson={(pid) => {
          setSelectedPersonId(pid);
          if (onSelectPerson) onSelectPerson(pid);
        }}
      />
    </div>
  );
};
