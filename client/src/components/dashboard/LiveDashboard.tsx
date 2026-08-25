import React from 'react';
import { 
  Users, UserCheck, HelpCircle, ShieldAlert, Camera, 
  Map, UserPlus, FileText, ArrowRight, Video 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { MetricCard } from '../common/MetricCard';
import { BuildingOccupancy3D } from './BuildingOccupancy3D';
import { CameraFeedMatrix } from './CameraFeedMatrix';
import { RealTimeAlertTicker } from './RealTimeAlertTicker';
import { NavTab } from '../common/Sidebar';

interface LiveDashboardProps {
  setActiveTab: (tab: NavTab) => void;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({ setActiveTab }) => {
  const { stats, triggerUnknownPersonPrompt } = useSecurity();

  return (
    <div className="space-y-6">
      {/* Top 5 Metric Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total In Building"
          value={stats.total_in_building}
          subtitle="Real-time occupancy"
          icon={Users}
          colorScheme="blue"
          onClick={() => setActiveTab('map')}
        />
        <MetricCard
          title="Authorized"
          value={stats.authorized}
          subtitle="90.6% cleared personnel"
          icon={UserCheck}
          colorScheme="green"
          onClick={() => setActiveTab('map')}
        />
        <MetricCard
          title="Unknown / Visitors"
          value={stats.unknown}
          subtitle="Pending / Unverified"
          icon={HelpCircle}
          colorScheme="amber"
          onClick={() => triggerUnknownPersonPrompt()}
        />
        <MetricCard
          title="Active Alerts"
          value={stats.alerts}
          subtitle="Automated AI threats"
          icon={ShieldAlert}
          colorScheme="red"
          onClick={() => setActiveTab('rules')}
        />
        <MetricCard
          title="Cameras Online"
          value={`${stats.cameras_online} / ${stats.total_cameras}`}
          subtitle="100% network health"
          icon={Camera}
          colorScheme="purple"
          onClick={() => setActiveTab('cameras')}
        />
      </div>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live AI Video Feed + Quick Action Bar */}
        <div className="lg:col-span-7 space-y-6">
          <CameraFeedMatrix />

          {/* Quick Actions Bar */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tactical Quick Actions:
            </div>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setActiveTab('map')}
                className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Interactive 2D Map</span>
              </button>
              <button
                onClick={triggerUnknownPersonPrompt}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll New Person</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Building Occupancy Breakdown + Real-time Alert Ticker */}
        <div className="lg:col-span-5 space-y-6">
          <BuildingOccupancy3D />
          <RealTimeAlertTicker onNavigateToMap={() => setActiveTab('map')} />
        </div>
      </div>
    </div>
  );
};
