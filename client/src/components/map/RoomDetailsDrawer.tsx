import React from 'react';
import { 
  X, Users, ShieldAlert, ShieldCheck, DoorOpen, 
  Camera, Lock, Clock, UserCheck, AlertTriangle 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { RoomZone, Person } from '../../types';

interface RoomDetailsDrawerProps {
  room: RoomZone | null;
  onClose: () => void;
  onSelectPerson: (personId: string) => void;
}

export const RoomDetailsDrawer: React.FC<RoomDetailsDrawerProps> = ({
  room,
  onClose,
  onSelectPerson
}) => {
  const { persons, cameras, alerts } = useSecurity();

  if (!room) return null;

  // Find all occupants in this room
  const occupants = persons.filter(p => p.current_room.toLowerCase() === room.name.toLowerCase() || room.occupants.includes(p.person_id));
  const roomCamera = cameras.find(c => c.room.toLowerCase() === room.name.toLowerCase());
  const roomAlerts = alerts.filter(a => a.room.toLowerCase() === room.name.toLowerCase() && a.status === 'Active');

  const occupancyPercentage = Math.round((room.current_occupancy / room.max_capacity) * 100);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900/95 border-l border-slate-700 shadow-2xl backdrop-blur-xl z-50 p-6 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
                {room.floor}
              </span>
              {room.is_restricted && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> RESTRICTED
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1.5">{room.name}</h2>
            <p className="text-xs text-slate-400">Corporate Tower A • Zone ID: {room.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Alerts in Room */}
        {roomAlerts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 space-y-2">
            <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>ACTIVE SECURITY BREACH</span>
            </div>
            {roomAlerts.map(a => (
              <p key={a.id} className="text-xs text-red-200">
                {a.description}
              </p>
            ))}
          </div>
        )}

        {/* Room Capacity & Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Occupancy</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {room.current_occupancy} <span className="text-xs text-slate-400">/ {room.max_capacity}</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${occupancyPercentage > 85 ? 'bg-red-500' : 'bg-sky-400'}`}
                style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coverage</span>
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
              {roomCamera ? roomCamera.camera_id : 'CAM-019 (100%)'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">4K AI Optical Lock</p>
          </div>
        </div>

        {/* Access Policies */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Access Clearance Rules
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {room.allowed_roles.map(role => (
              <span
                key={role}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Live Occupants Roster */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Occupants Inside ({occupants.length})
            </h4>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {occupants.map(person => (
              <div
                key={person.person_id}
                onClick={() => onSelectPerson(person.person_id)}
                className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={person.photo_url}
                    alt={person.name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-600"
                  />
                  <div>
                    <div className="font-semibold text-xs text-white">{person.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span>{person.person_id}</span>
                      <span>•</span>
                      <span className={person.status === 'Alert' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {person.status}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {person.role}
                </span>
              </div>
            ))}
            {occupants.length === 0 && (
              <p className="text-xs text-slate-500 italic py-2">No active occupants registered in zone.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono text-center">
        Eagle Eye Spatial Engine • Auto-Refreshed
      </div>
    </div>
  );
};
