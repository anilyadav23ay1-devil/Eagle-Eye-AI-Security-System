import React from 'react';
import { Building2, ArrowUpRight, ArrowDownRight, Layers, Users } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const BuildingOccupancy3D: React.FC = () => {
  const { stats, activeFloor, setActiveFloor } = useSecurity();

  const floorData = [
    { floor: 'Floor 4', name: 'Server Hub & Telecom', count: stats.floor_occupancies['Floor 4'] || 32, max: 40, color: 'from-purple-500 to-indigo-600', isRestricted: true },
    { floor: 'Floor 3', name: 'Executive Suites', count: stats.floor_occupancies['Floor 3'] || 28, max: 50, color: 'from-blue-500 to-cyan-500', isRestricted: false },
    { floor: 'Floor 2', name: 'Core Operations & Labs', count: stats.floor_occupancies['Floor 2'] || 38, max: 60, color: 'from-sky-400 to-blue-600', isRestricted: false },
    { floor: 'Floor 1', name: 'Main Lobby & Reception', count: stats.floor_occupancies['Floor 1'] || 30, max: 80, color: 'from-emerald-400 to-teal-600', isRestricted: false },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Building Spatial Occupancy</h3>
            <p className="text-xs text-slate-400">Corporate Tower A • 4 Active Levels</p>
          </div>
        </div>

        {/* Entry / Exit Daily Tally */}
        <div className="flex items-center space-x-3 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
          <div className="flex items-center space-x-1 text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{stats.entries_today}</span>
            <span className="text-[10px] text-slate-400 font-sans">Entries</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center space-x-1 text-amber-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-{stats.exits_today}</span>
            <span className="text-[10px] text-slate-400 font-sans">Exits</span>
          </div>
        </div>
      </div>

      {/* Building Visualization Grid & Level Bars */}
      <div className="grid grid-cols-1 gap-2.5">
        {floorData.map((f) => {
          const isSelected = activeFloor === f.floor;
          const percentage = Math.round((f.count / f.max) * 100);

          return (
            <div
              key={f.floor}
              onClick={() => setActiveFloor(f.floor)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-500/60 shadow-md shadow-sky-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {f.floor}
                  </span>
                  <span className="text-xs font-medium text-slate-300">{f.name}</span>
                  {f.isRestricted && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60">
                      RESTRICTED
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-100">{f.count}</span>
                  <span className="text-[11px] text-slate-500 font-mono">/ {f.max} max</span>
                  <span className="text-[11px] font-mono text-sky-400 font-semibold w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`bg-gradient-to-r ${f.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
