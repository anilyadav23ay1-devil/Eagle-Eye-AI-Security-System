import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Plus, Play, CheckCircle2, 
  Clock, AlertTriangle, Lock, Eye, Sparkles 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { SecurityRule, AlertType, AlertSeverity } from '../../types';

export const SecurityRulesManager: React.FC = () => {
  const { rules, alerts, resolveAlert, simulateAlert } = useSecurity();
  const [activeTab, setActiveTab] = useState<'rules' | 'incidents'>('rules');
  const [selectedAlertToResolve, setSelectedAlertToResolve] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertToResolve) return;
    resolveAlert(selectedAlertToResolve, resolutionNotes || 'Investigated and verified by Security Operations.');
    setSelectedAlertToResolve(null);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Security Rules & Autonomous Alert Engine</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Active Protocol
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Define geofencing boundaries, loitering thresholds, and automated threat mitigation policies
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'rules' ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Configured Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'incidents' ? 'bg-red-500 text-white shadow-sm shadow-red-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Incident Log ({alerts.length})
          </button>
        </div>
      </div>

      {/* Trigger Simulation Test Strip */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Real-Time Rule Evaluation Simulator (1-Click Trigger):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => simulateAlert('Unauthorized Access', 'Server Room')}
            className="p-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-600/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300">Server Room Breach</span>
              <Play className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[10px] text-red-400/80 mt-1 font-mono">Simulate non-whitelisted badge in vault</p>
          </button>

          <button
            onClick={() => simulateAlert('Tailgating Detected', 'Main Entrance')}
            className="p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Turnstile Tailgating</span>
              <Play className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[10px] text-amber-400/80 mt-1 font-mono">Simulate 2 people on 1 scan (&lt;1.5s)</p>
          </button>

          <button
            onClick={() => simulateAlert('Loitering Detected', 'North Corridor')}
            className="p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">Corridor Loitering</span>
              <Play className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[10px] text-blue-400/80 mt-1 font-mono">Simulate stationary occupant &gt; 5 mins</p>
          </button>

          <button
            onClick={() => simulateAlert('Permission Expired', 'Executive Floor')}
            className="p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300">Visitor Badge Expiry</span>
              <Play className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[10px] text-purple-400/80 mt-1 font-mono">Simulate visitor staying past 6:00 PM</p>
          </button>
        </div>
      </div>

      {activeTab === 'rules' ? (
        /* Rules Configuration List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-white">{rule.name}</h3>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      rule.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {rule.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                  ENABLED
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800/80">
                <span>Type: <strong>{rule.type}</strong></span>
                <span>Evaluation: <strong>Real-Time (10 FPS)</strong></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Incidents Table */
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Full Security Breach Log</h3>
            <span className="text-xs font-mono text-slate-400">Total {alerts.length} Incidents</span>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{alert.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{alert.alert_id}</span>
                  </div>
                  <p className="text-xs text-slate-300">{alert.description}</p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {alert.timestamp} • {alert.floor} • {alert.room} ({alert.camera_id})
                  </div>
                </div>

                <div>
                  {alert.status === 'Active' ? (
                    <button
                      onClick={() => setSelectedAlertToResolve(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
                    >
                      Resolve Incident
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                      ✓ RESOLVED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incident Resolution Modal */}
      {selectedAlertToResolve && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Log Incident Resolution</h3>
            <p className="text-xs text-slate-400">
              Provide guard action report and clearance verification notes.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Guard inspected room. Identity verified with host, false trigger reset."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlertToResolve(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
