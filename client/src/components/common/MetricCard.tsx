import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-950/30',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/10',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  green: {
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  amber: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/10',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  red: {
    bg: 'bg-red-950/30',
    border: 'border-red-500/40',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
    iconBg: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
  },
  purple: {
    bg: 'bg-purple-950/30',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/10',
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  onClick,
}) => {
  const styles = colorStyles[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 border backdrop-blur-md transition-all duration-300 ${styles.bg} ${styles.border} shadow-lg ${styles.glow} ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-opacity-80' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className={`text-3xl font-extrabold font-mono tracking-tight ${styles.text}`}>{value}</h3>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {/* Decorative accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${colorScheme === 'blue' ? 'sky' : colorScheme}-400 to-transparent opacity-60`} />
    </div>
  );
};
