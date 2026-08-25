import React from 'react';
import { 
  LayoutDashboard, Map, UserCheck, History, ShieldAlert, 
  Camera, BarChart3, UserPlus, Sliders, Settings 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export type NavTab = 
  | 'dashboard' 
  | 'map' 
  | 'tracking' 
  | 'appearance' 
  | 'enrollment' 
  | 'rules' 
  | 'cameras' 
  | 'analytics';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { alerts, stats } = useSecurity();
  const activeAlertsCount = alerts.filter(a => a.status === 'Active').length;

  const navItems = [
    { id: 'dashboard', label: 'Live Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'map', label: '2D Floor Map', icon: Map, badge: `${stats.total_in_building}` },
    { id: 'tracking', label: 'Person Tracking', icon: UserCheck, badge: null },
    { id: 'appearance', label: 'Appearance Vault', icon: History, badge: 'AI' },
    { id: 'enrollment', label: 'Person Enrollment', icon: UserPlus, badge: stats.unknown > 0 ? `${stats.unknown}` : null, badgeColor: 'bg-purple-500' },
    { id: 'rules', label: 'Rules & Alerts', icon: ShieldAlert, badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : null, badgeColor: 'bg-red-500' },
    { id: 'cameras', label: 'Camera Matrix', icon: Camera, badge: `${stats.cameras_online}` },
    { id: 'analytics', label: 'Analytics & ROI', icon: BarChart3, badge: null },
  ];

  return (
    <aside className="w-64 bg-cyber-dark/90 border-r border-cyber-border flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Command Center Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white font-mono ${
                  item.badgeColor || (isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Facility Quick Stat Pill */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Active Building:</span>
          <span className="font-semibold text-slate-200">Tower A</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Total Cameras:</span>
          <span className="font-mono text-sky-400 font-semibold">{stats.cameras_online} / 96</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full" 
            style={{ width: `${(stats.cameras_online / 96) * 100}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
          <span>AI Inference: ~18ms</span>
          <span className="text-emerald-400 font-mono">100% ONLINE</span>
        </div>
      </div>
    </aside>
  );
};
