import React, { useState } from 'react';
import { 
  UserCheck, Search, MapPin, Camera, Clock, 
  ArrowRight, ShieldCheck, Radio, Navigation, Eye 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { MovementEvent } from '../../types';

export const PersonTrackingView: React.FC = () => {
  const { persons, selectedPerson, setSelectedPersonId } = useSecurity();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveFollowActive, setIsLiveFollowActive] = useState<boolean>(true);

  // Mock sample movement history matching Sheet 6
  const sampleTimeline: MovementEvent[] = [
    { id: 'm1', person_id: 'P-10087', track_id: 'TRK-25-000567', timestamp: '09:42:11 AM', camera_id: 'CAM-001', building: 'Building A', floor: 'Floor 1', room: 'Main Entrance', event_type: 'ENTER', dwell_time_seconds: 51 },
    { id: 'm2', person_id: 'P-10087', track_id: 'TRK-25-000567', timestamp: '09:43:02 AM', camera_id: 'CAM-003', building: 'Building A', floor: 'Floor 1', room: 'Reception', event_type: 'ENTER', dwell_time_seconds: 135 },
    { id: 'm3', person_id: 'P-10087', track_id: 'TRK-25-000567', timestamp: '09:45:17 AM', camera_id: 'CAM-007', building: 'Building A', floor: 'Floor 1', room: 'Elevator Lobby', event_type: 'ENTER', dwell_time_seconds: 45 },
    { id: 'm4', person_id: 'P-10087', track_id: 'TRK-25-000567', timestamp: '09:46:02 AM', camera_id: 'CAM-014', building: 'Building A', floor: 'Floor 2', room: 'Floor 2 - Corridor', event_type: 'ENTER', dwell_time_seconds: 122 },
    { id: 'm5', person_id: 'P-10087', track_id: 'TRK-25-000567', timestamp: '09:48:04 AM', camera_id: 'CAM-018', building: 'Building A', floor: 'Floor 2', room: 'Office 201', event_type: 'ENTER', dwell_time_seconds: 2047 },
    { id: 'm6', person_id: 'P-10087', track_id: 'TRK-25-000567', timestamp: '10:22:11 AM', camera_id: 'CAM-021', building: 'Building A', floor: 'Floor 2', room: 'Meeting Room', event_type: 'ENTER', dwell_time_seconds: 150 },
  ];

  const filteredPersons = persons.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.person_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.track_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePerson = selectedPerson || persons[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Person Search Roster */}
      <div className="lg:col-span-4 space-y-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Active Occupants Directory</h3>
            <span className="text-xs font-mono text-sky-400 font-bold">{persons.length} Tracked</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or track token..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          {/* Person List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredPersons.map(p => {
              const isSelected = p.person_id === activePerson?.person_id;
              const isAlert = p.status === 'Alert';

              return (
                <div
                  key={p.person_id}
                  onClick={() => setSelectedPersonId(p.person_id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-950/50 border-sky-500 shadow-md shadow-sky-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.photo_url}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-semibold text-xs text-white">{p.name}</h4>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.person_id} • <span className={isAlert ? 'text-red-400 font-bold' : 'text-emerald-400'}>{p.status}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {p.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Person Dossier & Movement Timeline */}
      <div className="lg:col-span-8 space-y-6">
        {activePerson && (
          <>
            {/* Person Profile Header Dossier */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-sky-500 shadow-lg shadow-sky-500/20">
                    <img
                      src={activePerson.photo_url}
                      alt={activePerson.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center font-mono text-emerald-400 py-0.5">
                      ENROLLED
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-extrabold text-white">{activePerson.name}</h2>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {activePerson.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono text-slate-300">
                      <div><span className="text-slate-500">Person ID:</span> {activePerson.person_id}</div>
                      <div><span className="text-slate-500">Track ID:</span> {activePerson.track_id}</div>
                      <div><span className="text-slate-500">Role:</span> {activePerson.role}</div>
                      <div><span className="text-slate-500">Mobile:</span> {activePerson.mobile}</div>
                    </div>
                  </div>
                </div>

                {/* Live Follow Mode Toggle */}
                <button
                  onClick={() => setIsLiveFollowActive(!isLiveFollowActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                    isLiveFollowActive
                      ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>{isLiveFollowActive ? 'Live Follow Active' : 'Enable Live Follow'}</span>
                </button>
              </div>

              {/* Current Location Badge */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Current Location</span>
                    <div className="text-sm font-bold text-white">
                      {activePerson.current_building} &gt; {activePerson.current_floor} &gt; {activePerson.current_room}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
                  <div><span className="text-slate-500">Since:</span> {activePerson.last_seen_time}</div>
                  <div><span className="text-slate-500">Camera:</span> <strong className="text-sky-400">{activePerson.current_camera_id}</strong></div>
                </div>
              </div>
            </div>

            {/* Movement Timeline & Trajectory */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Movement History Timeline (Today)</h3>
                  <p className="text-xs text-slate-400">Chronological room-to-room transit events</p>
                </div>

                {/* Summary Metrics */}
                <div className="flex items-center space-x-4 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px]">TOTAL TIME:</span>{' '}
                    <strong className="text-emerald-400">00:42:21</strong>
                  </div>
                  <div className="w-px h-3 bg-slate-700" />
                  <div>
                    <span className="text-slate-500 text-[10px]">AREAS VISITED:</span>{' '}
                    <strong className="text-sky-400">6</strong>
                  </div>
                  <div className="w-px h-3 bg-slate-700" />
                  <div>
                    <span className="text-slate-500 text-[10px]">FIRST SEEN:</span>{' '}
                    <strong className="text-slate-200">09:42 AM</strong>
                  </div>
                </div>
              </div>

              {/* Step by Step Timeline List */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                {sampleTimeline.map((item, index) => {
                  const isLast = index === sampleTimeline.length - 1;

                  return (
                    <div key={item.id} className="relative flex items-center justify-between">
                      {/* Dot icon */}
                      <span className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 ${
                        isLast 
                          ? 'bg-sky-400 border-sky-300 ring-4 ring-sky-500/20 animate-pulse' 
                          : 'bg-slate-800 border-slate-500'
                      }`} />

                      <div className="flex items-center space-x-4">
                        <span className="text-xs font-mono text-sky-400 font-semibold w-24">
                          {item.timestamp}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white">{item.room}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">({item.camera_id})</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isLast 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isLast ? 'CURRENT' : 'ENTER'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
