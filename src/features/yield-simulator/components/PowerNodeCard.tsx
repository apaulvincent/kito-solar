import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PowerNodeCardProps {
  icon: LucideIcon;
  iconContainerClass: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeClass: string;
  valueText: string;
  valueClass: string;
  unit: string;
  rightCaption: string;
  progressPercent: number;
  progressBarClass: string;
}

export const PowerNodeCard: React.FC<PowerNodeCardProps> = ({
  icon: Icon,
  iconContainerClass,
  title,
  subtitle,
  badgeText,
  badgeClass,
  valueText,
  valueClass,
  unit,
  rightCaption,
  progressPercent,
  progressBarClass,
}) => (
  <div className="rounded-xl bg-slate-50/90 dark:bg-[#131B2B] p-4 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconContainerClass}`}>
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white block">{title}</span>
          <span className="text-[11px] font-mono tabular-nums text-slate-400">{subtitle}</span>
        </div>
      </div>
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
        {badgeText}
      </span>
    </div>

    <div className="flex items-baseline justify-between">
      <div>
        <span className={`text-2xl font-bold font-mono tabular-nums ${valueClass}`}>
          {valueText}
        </span>
        <span className="text-xs font-mono text-slate-400 ml-1">{unit}</span>
      </div>
      <span className="text-[11px] font-mono tabular-nums text-slate-400">{rightCaption}</span>
    </div>

    <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${progressBarClass}`}
        style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
      />
    </div>
  </div>
);
