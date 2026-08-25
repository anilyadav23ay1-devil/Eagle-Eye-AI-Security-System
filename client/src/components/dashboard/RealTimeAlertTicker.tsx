import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, 
  MapPin, Clock, Camera, Send, X 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { SecurityAlert, AlertSeverity } from '../../types';

interface AlertTickerProps {
  onNavigateToMap?: () => void;
}

export const RealTimeAlertTicker: React.FC<AlertTickerProps> = ({ onNavigateToMap }) => {
  const { alerts, resolveAlert, setSelectedPersonId, setSelectedRoomId } = useSecurity();
  const [selectedAlertForNotes, setSelectedAlertForNotes] = useState<SecurityAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const severityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const handleQuickResolve = (alert: SecurityAlert) => {
    resolveAlert(alert.id, 'Resolved by Command Center Security Officer');
  };

  const handleTrackAlertOnMap = (alert: SecurityAlert) => {
    if (alert.person_id) {
      setSelectedPersonId(alert.person_id);
    }
    if (alert.room) {
      // Find room id or select it
      setSelectedRoomId('room-server');
    }
    if (onNavigateToMap) {
      onNavigateToMap();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>Real-Time Security Alerts</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                {alerts.filter(a => a.status === 'Active').length} ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400">Automated AI Threat & Breach Detection</p>
          </div>
        </div>
      </div>

      {/* Alert items list */}
      <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
        {alerts.map((alert) => {
          const isResolved = alert.status === 'Resolved';

          return (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border transition-all ${
                isResolved
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : alert.severity === 'Critical'
                  ? 'bg-red-950/30 border-red-500/50 shadow-sm shadow-red-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${severityBadge(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{alert.title}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {alert.description}
                  </p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {alert.timestamp}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {alert.floor} • {alert.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-400" />
                      {alert.camera_id}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end space-y-1.5 shrink-0">
                  {!isResolved ? (
                    <>
                      <button
                        onClick={() => handleQuickResolve(alert)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                      <button
                        onClick={() => handleTrackAlertOnMap(alert)}
                        className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all"
                      >
                        <ChevronRight className="w-3 h-3" />
                        <span>Track on Map</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      RESOLVED
                    </span>
                  )}
                </div>
              </div>

              {alert.guard_notes && (
                <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80 font-mono">
                  Guard Log: {alert.guard_notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
