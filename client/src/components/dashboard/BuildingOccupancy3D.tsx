import React from 'react';
import { Building2, ArrowUpRight, ArrowDownRight, Layers, Users } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const BuildingOccupancy3D: React.FC = () => {
  const { stats, activeFloor, setActiveFloor, activeBuilding, buildings } = useSecurity();

  const currentBldg = buildings.find(b => b.name === activeBuilding || b.id === activeBuilding) || buildings[0];
  const bldgFloors = currentBldg?.floors || [];

  const defaultColors = [
    'from-emerald-400 to-teal-600',
    'from-sky-400 to-blue-600',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-600',
    'from-amber-500 to-orange-600'
  ];

  const floorData = bldgFloors.map((f, i) => {
    const floorOccupancy = stats.floor_occupancies[f.floor_name] || (f.rooms.reduce((acc, r) => acc + r.current_occupancy, 0)) || (30 - i * 4);
    const maxCap = (f.rooms.reduce((acc, r) => acc + r.max_capacity, 0)) || (60 - i * 5);
    const isRestricted = f.rooms.some(r => r.is_restricted) || f.floor_number === 4;

    return {
      floor: f.floor_name,
      name: f.floor_name === 'Floor 1' ? 'Main Lobby & Reception' : f.floor_name === 'Floor 2' ? 'Core Operations & Labs' : f.floor_name === 'Floor 3' ? 'Executive Suites' : f.floor_name === 'Floor 4' ? 'Server Hub & Telecom' : `${currentBldg?.name || 'Building'} Level ${f.floor_number}`,
      count: floorOccupancy,
      max: maxCap,
      color: defaultColors[i % defaultColors.length],
      isRestricted
    };
  }).reverse(); // Display top floor on top, ground floor at bottom

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Building Spatial Occupancy</h3>
            <p className="text-xs text-slate-400">
              {currentBldg?.name || 'Corporate Tower A'} • {bldgFloors.length} Active Levels
            </p>
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
                  <span className="text-xs font-medium text-slate-300 truncate max-w-[150px]">{f.name}</span>
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
