import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Tag, ShieldAlert, Sparkles, CheckCircle2, Umbrella } from 'lucide-react';

export const TimelineItem = ({ activity, index, isPlanB = false }) => {
  const {
    time,
    title,
    category,
    description,
    location_name,
    type,
    cost_estimate,
    elder_friendly,
    wheelchair_friendly,
    diet_tags = [],
    indoor_alternative,
    insider_tip
  } = activity;

  const getTypeBadge = (t) => {
    if (t === 'indoor') return { label: 'Indoor Sheltered', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    if (t === 'covered_outdoor') return { label: 'Covered Courtyard', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' };
    return { label: 'Outdoor Scenic', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  };

  const badge = getTypeBadge(type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="relative pl-8 pb-8 group last:pb-0"
    >
      {/* Vertical timeline connector */}
      <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 group-last:hidden" />

      {/* Node circle */}
      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-primary-500 flex items-center justify-center text-primary-500 shadow-md">
        <span className="w-2 h-2 rounded-full bg-primary-500" />
      </div>

      {/* Card Body */}
      <div className={`glass-card p-4 rounded-2xl border transition-all ${
        isPlanB ? 'border-teal-500/30 bg-teal-500/5' : 'border-slate-200/70 dark:border-slate-800/70'
      }`}>
        {/* Header: Time, Badges, Cost */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>{time}</span>
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
              {badge.label}
            </span>

            {isPlanB && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-500 border border-teal-500/30 flex items-center gap-1">
                <Umbrella className="w-3 h-3" />
                Plan B Active
              </span>
            )}
          </div>

          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {cost_estimate > 0 ? `Est. ₹${Number(cost_estimate).toLocaleString()}` : 'Free Entry'}
          </span>
        </div>

        {/* Title & Location */}
        <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight">
          {title}
        </h4>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
          <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          <span>{location_name}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          {description}
        </p>

        {/* Dietary & Accessibility Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {elder_friendly && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Elder Accessible
            </span>
          )}
          {diet_tags.map((dt) => (
            <span
              key={dt}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
            >
              🥗 {dt}
            </span>
          ))}
        </div>

        {/* Insider Tip & Plan B note */}
        {insider_tip && (
          <div className="mt-2 p-2 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span><strong>WanderMind Tip:</strong> {insider_tip}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
