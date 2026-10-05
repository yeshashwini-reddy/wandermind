import React from 'react';
import { Plane, ExternalLink, Clock, Check, Star, ArrowRight, AlertTriangle } from 'lucide-react';

export const TransportCard = ({ option, isSelected, onSelect, travelersCount = 1 }) => {
  const {
    id,
    airline,
    provider = airline || "Flight",
    origin,
    destination,
    price,
    total_price,
    duration,
    departure,
    arrival,
    booking_url,
    reason,
    badge,
    refundable,
    comfort_score,
    warning_flags = []
  } = option || {};

  const Icon = Plane;
  const calculatedTotal = total_price || (price * travelersCount);

  const getBadgeStyle = (b) => {
    if (!b) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    if (b.includes('Fastest')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (b.includes('Cheapest')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (b.includes('Best Value')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  };

  const handleExternalBooking = (e) => {
    e.stopPropagation();
    if (booking_url) {
      window.open(booking_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-500/5 shadow-2xl shadow-primary-500/10'
          : 'border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
      }`}
    >
      {/* Header Row: Mode Badge, Route, Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/40 dark:border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 text-primary-400 shadow-inner">
            <Icon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-primary-400">
                {(option?.transport_mode || 'FLIGHT').toUpperCase()}
              </span>
              {badge && (
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(badge)}`}>
                  {badge}
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <span>{origin}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span>{destination}</span>
            </div>
          </div>
        </div>

        {/* Price Tag */}
        <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center">
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight text-right">
            ₹{Number(price).toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">/ person</span>
          </div>
          {travelersCount > 1 && (
            <span className="text-[11px] text-slate-400 font-medium">
              ₹{Number(calculatedTotal).toLocaleString()} total ({travelersCount} travelers)
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Provider, Duration, Timing, Reason */}
      <div className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Provider</span>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
            {provider}
          </p>
        </div>

        <div className="sm:col-span-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Travel Time</span>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{duration}</span>
            {departure && arrival && (
              <span className="text-[10px] text-slate-400 font-normal">({departure} - {arrival})</span>
            )}
          </div>
        </div>

        {/* Short Concise Reason (Structured Decision) */}
        <div className="sm:col-span-5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Decision Match</span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {reason}
          </p>
        </div>
      </div>

      {/* Warnings if any */}
      {warning_flags && warning_flags.length > 0 && (
        <div className="pb-3 flex flex-wrap gap-2">
          {warning_flags.map((w, idx) => (
            <span key={idx} className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Actions Row: Select & Visit Website External Link */}
      <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className={refundable ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
            {refundable ? "✓ Refundable" : "• Non-refundable"}
          </span>
          {comfort_score && (
            <>
              <span>•</span>
              <span className="flex items-center text-amber-400 font-medium">
                <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                {comfort_score}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* External Booking Portal Button */}
          {booking_url && (
            <button
              onClick={handleExternalBooking}
              type="button"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 shadow-sm flex items-center space-x-1.5 transition-all hover:scale-[1.02]"
              title={`Opens ${provider} official website in a new tab`}
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-primary-400" />
            </button>
          )}

          {/* Select for Itinerary button */}
          <button
            onClick={onSelect}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${
              isSelected
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Selected</span>
              </>
            ) : (
              <span>Select Option</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
