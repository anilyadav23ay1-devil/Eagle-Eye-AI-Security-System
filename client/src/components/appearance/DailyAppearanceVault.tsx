import React from 'react';
import { History, Sparkles, AlertCircle, Calendar, Clock, CheckCircle2, User, Camera, ShieldCheck } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const DailyAppearanceVault: React.FC = () => {
  const { selectedPerson, setSelectedPersonId, persons } = useSecurity();
  const person = selectedPerson || persons[0];

  const historicalSnapshots = [
    {
      date: '24 Aug 2025 (Today)',
      time: '09:42 AM',
      photo: person?.today_appearance_url || person?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
      outfit: 'Standard Corporate / Navy Attire',
      verified: true
    },
    {
      date: '23 Aug 2025',
      time: '09:38 AM',
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face',
      outfit: 'Red Plaid Button-Down Shirt',
      verified: true
    },
    {
      date: '22 Aug 2025',
      time: '09:41 AM',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
      outfit: 'Charcoal Gray Crew Neck',
      verified: true
    },
    {
      date: '21 Aug 2025',
      time: '09:35 AM',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face',
      outfit: 'Mustard Yellow Casual Shirt',
      verified: true
    },
    {
      date: '20 Aug 2025',
      time: '09:40 AM',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      outfit: 'Classic Black Formal Suit',
      verified: true
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Daily Appearance Snapshot & Outfit Vault</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                AI Re-Identification
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Tracking visual wardrobe variations, daily attire changes, and biometric vector consistency
            </p>
          </div>
        </div>

        {/* Person Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
          <span className="text-slate-400 font-semibold">Inspect Person:</span>
          <select
            value={person?.person_id}
            onChange={(e) => setSelectedPersonId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-sky-400 font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
          >
            {persons.map(p => (
              <option key={p.person_id} value={p.person_id}>
                {p.name} ({p.person_id} - {p.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Verification vs Today's Snapshot (Side by Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Master Identity Photo */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-sky-400">REFERENCE STANDARD</span>
              <h3 className="text-base font-bold text-white">Primary Master Identity Photo</h3>
              <p className="text-xs text-slate-400">Master enrollment photograph used for biometric facial verification</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              VERIFIED
            </span>
          </div>

          <div className="flex items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="relative w-48 h-56 rounded-2xl overflow-hidden border-2 border-sky-500 shadow-xl shadow-sky-500/10">
              <img
                src={person?.photo_url}
                alt="Primary identity"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-center text-[10px] font-mono text-slate-200">
                Master ID: {person?.person_id}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Biometric Vector:</span>
              <span className="text-emerald-400 font-bold">ArcFace 512-D Valid</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Security Clearance:</span>
              <span className="text-sky-300 font-bold">{person?.role} Access Level</span>
            </div>
          </div>
        </div>

        {/* Today's Latest Appearance */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">DYNAMIC OPTICAL CAPTURE</span>
              <h3 className="text-base font-bold text-white">Today's Live Appearance Capture</h3>
              <p className="text-xs text-slate-400">Optical camera ingestion recorded upon entry today</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              LIVE MATCH (98.4%)
            </span>
          </div>

          <div className="flex items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="relative w-48 h-56 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl shadow-emerald-500/10">
              <img
                src={person?.today_appearance_url || person?.photo_url}
                alt="Today's appearance"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-center text-[10px] font-mono text-emerald-300">
                Captured: {person?.last_seen_time || '09:42 AM'} (CAM-001)
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Current Attire:</span>
              <span className="text-slate-200 font-bold">Standard Corporate Jacket</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Last Location:</span>
              <span className="text-sky-400">{person?.current_building} ({person?.current_room})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Look Timeline */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white">Historical Wardrobe & Look Timeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {historicalSnapshots.map((snap, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-700">
                <img src={snap.photo} alt={snap.date} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono px-1.5 py-0.5 rounded text-emerald-400">
                  {snap.time}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">{snap.date}</div>
                <div className="text-[11px] text-slate-400 truncate">{snap.outfit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
