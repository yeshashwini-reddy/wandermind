import React from 'react';
import { Hotel, Check, AlertTriangle, Star } from 'lucide-react';

export const BookingOptionCard = ({ option, isSelected, onSelect }) => {
  const {
    name,
    title = name || "Hotel",
    badge,
    duration_or_tier,
    price,
    price_per_night,
    price_per_person,
    refundable,
    comfort_score,
    rating = comfort_score,
    ai_reasoning,
    warning_flags = []
  } = option || {};

  const Icon = Hotel;

  const getBadgeColor = (b) => {
    if (b.includes('Best Value')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    if (b.includes('Fastest')) return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    if (b.includes('Cheapest')) return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
  };

  return (
    <div
      onClick={onSelect}
      className={`glass-card p-4 rounded-2xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-500/5 shadow-lg'
          : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left: Icon, Details, Provider */}
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary-500 shrink-0">
            <Icon className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeColor(badge)}`}>
                {badge}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{duration_or_tier}</span>
              <span>•</span>
              <span className="flex items-center text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-500 mr-0.5" />
                {comfort_score}
              </span>
              <span>•</span>
              <span className={refundable ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>
                {refundable ? "Refundable" : "Non-refundable"}
              </span>
            </div>

            {/* AI Reasoning */}
            <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
              {ai_reasoning}
            </p>

            {/* Warnings */}
            {warning_flags.length > 0 && (
              <div className="pt-1 space-y-1">
                {warning_flags.map((w, i) => (
                  <span key={i} className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Price & External Link */}
        <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
            ₹{Number(price).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">₹{Number(price_per_person).toLocaleString()} / person</span>
          {option.booking_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(option.booking_url, '_blank', 'noopener,noreferrer');
              }}
              type="button"
              className="text-[11px] font-bold text-teal-500 hover:text-teal-400 flex items-center gap-1 pt-1 hover:underline"
            >
              <span>Visit Website</span>
              <span className="text-xs">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
