import React from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, ShieldCheck, 
  Download, FileSpreadsheet, CheckCircle2, Clock 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const AnalyticsDashboard: React.FC = () => {
  const { stats, alerts } = useSecurity();

  const hourlyTraffic = [
    { hour: '06:00 AM', count: 6 },
    { hour: '07:00 AM', count: 20 },
    { hour: '08:00 AM', count: 73 },
    { hour: '09:00 AM', count: 126 },
    { hour: '10:00 AM', count: 64 },
    { hour: '11:00 AM', count: 45 },
    { hour: '12:00 PM', count: 88 },
    { hour: '01:00 PM', count: 95 },
    { hour: '02:00 PM', count: 52 },
    { hour: '03:00 PM', count: 40 },
    { hour: '04:00 PM', count: 32 },
    { hour: '05:00 PM', count: 110 },
  ];

  const zoneUtilization = [
    { name: 'Executive Meeting Room A', pct: 88, dwell: '45 mins', count: 8, max: 16 },
    { name: 'Office 201 - Engineering Hub', pct: 70, dwell: '120 mins', count: 4, max: 10 },
    { name: 'Office 202 - Product Operations', pct: 50, dwell: '95 mins', count: 2, max: 8 },
    { name: 'Server Room Restricted Vault', pct: 25, dwell: '15 mins', count: 3, max: 4 },
    { name: 'Cafeteria & Pantry Lounge', pct: 40, dwell: '10 mins', count: 1, max: 10 },
  ];

  const downloadAuditReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Incident Type,Location,Track ID,Status,Guard Notes\n"
      + alerts.map(a => `"${a.timestamp}","${a.type}","${a.floor} - ${a.room}","${a.track_id || 'N/A'}","${a.status}","${a.guard_notes || 'None'}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eagle_eye_audit_compliance_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Business Benefits, Compliance & ROI Analytics</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Measurable Impact
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Auditable security telemetry, space utilization heatmaps, and financial savings projection
            </p>
          </div>
        </div>

        {/* Download CSV/PDF Button */}
        <button
          onClick={downloadAuditReport}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Compliance Audit Report (CSV)</span>
        </button>
      </div>

      {/* ROI & Financial Impact Banner (Matching Sheet 10) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-blue-500/30 text-center space-y-1">
          <span className="text-3xl font-extrabold text-blue-400 font-mono">30-50%</span>
          <h4 className="text-xs font-bold text-slate-200">Reduction in Security Incidents</h4>
          <p className="text-[11px] text-slate-400">Automated AI threat interception</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30 text-center space-y-1">
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">25-40%</span>
          <h4 className="text-xs font-bold text-slate-200">Operational Cost Savings</h4>
          <p className="text-[11px] text-slate-400">Reduces manual guard workload</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-purple-500/30 text-center space-y-1">
          <span className="text-3xl font-extrabold text-purple-400 font-mono">100%</span>
          <h4 className="text-xs font-bold text-slate-200">Audit & Compliance Readiness</h4>
          <p className="text-[11px] text-slate-400">Instant digital access logs</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 text-center space-y-1">
          <span className="text-3xl font-extrabold text-amber-400 font-mono">6 - 12 Mo</span>
          <h4 className="text-xs font-bold text-slate-200">Typical Payback Period</h4>
          <p className="text-[11px] text-slate-400">High ROI through risk mitigation</p>
        </div>
      </div>

      {/* Traffic & Spatial Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Footfall Chart */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Hourly Building Footfall & Traffic Distribution</h3>
              <p className="text-xs text-slate-400">Optical sensor turnstile volume across 24h</p>
            </div>
            <span className="text-xs font-mono text-sky-400 font-bold">Peak: 09:00 AM (126)</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2">
            {hourlyTraffic.map((item, index) => {
              const maxVal = 130;
              const heightPct = Math.round((item.count / maxVal) * 100);

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </div>
                  <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden h-44 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-sky-600 to-cyan-400 rounded-t-lg group-hover:from-sky-500 group-hover:to-cyan-300 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                    {item.hour.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Utilization & Space Metrics */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Zone & Facility Space Utilization</h3>
            <p className="text-xs text-slate-400">Average occupancy vs maximum room capacity</p>
          </div>

          <div className="space-y-3">
            {zoneUtilization.map((zone, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{zone.name}</span>
                  <span className="font-mono text-sky-400 font-bold">{zone.pct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${zone.pct > 80 ? 'bg-amber-400' : 'bg-sky-500'}`}
                    style={{ width: `${zone.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Occupancy: {zone.count}/{zone.max}</span>
                  <span>Avg Dwell: {zone.dwell}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
