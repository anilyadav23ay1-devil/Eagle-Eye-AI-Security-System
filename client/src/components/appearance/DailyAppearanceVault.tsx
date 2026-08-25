import React from 'react';
import { History, Sparkles, AlertCircle, Calendar, Clock, CheckCircle2, User } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const DailyAppearanceVault: React.FC = () => {
  const { selectedPerson, persons } = useSecurity();
  const person = selectedPerson || persons[0];

  const historicalSnapshots = [
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
            <p className="text-xs text-slate-400">
              Tracking visual look changes, daily wardrobe variations, and biometric consistency
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
          <span>Selected: <strong className="text-sky-400">{person?.name} ({person?.person_id})</strong></span>
        </div>
      </div>

      {/* Primary Verification vs Today's Snapshot (Side by Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Master Identity Photo */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-sky-400">REFERENCE STANDARD</span>
              <h3 className="text-base font-bold text-white">Primary Identity Photo</h3>
              <p className="text-xs text-slate-400">Master enrollment photograph used for biometric verification</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
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
                Enrolled: 24 Aug 2025
              </div>
            </div>
          </div>
        </div>

        {/* Today's Latest Appearance */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">DYNAMIC OPTICAL CAPTURE</span>
              <h3 className="text-base font-bold text-white">Today's Latest Appearance</h3>
              <p className="text-xs text-slate-400">Auto-captured at CAM-001 Turnstile (24 Aug 2025 - 09:47 AM)</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 98.6% MATCH
            </span>
          </div>

          <div className="flex items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="relative w-48 h-56 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl shadow-emerald-500/10">
              <img
                src={person?.today_appearance_url}
                alt="Today's appearance"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-center text-[10px] font-mono text-emerald-400 font-bold">
                Navy Blue Oxford Shirt
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Appearance History Carousel / Cards */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Appearance History Timeline</h3>
            <p className="text-xs text-slate-400">Daily visual references captured over previous entries</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{historicalSnapshots.length} Past Visits</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {historicalSnapshots.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all space-y-2.5"
            >
              <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <img
                  src={item.photo}
                  alt={item.outfit}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1 text-center">
                <div className="text-xs font-bold text-white font-mono">{item.date}</div>
                <div className="text-[10px] text-sky-400 font-mono">{item.time}</div>
                <div className="text-[11px] text-slate-400 truncate" title={item.outfit}>
                  {item.outfit}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Intelligence Note */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>AI Outfit Intelligence:</strong> System automatically registers daily appearance snapshots upon first camera acquisition each morning. If a significant mid-day wardrobe change is detected, an automated guard verification flag is raised.
          </span>
        </div>
      </div>
    </div>
  );
};
