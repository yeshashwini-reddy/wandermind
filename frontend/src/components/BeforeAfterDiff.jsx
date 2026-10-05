import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';

export const BeforeAfterDiff = ({ replanResponse }) => {
  if (!replanResponse || !replanResponse.before_vs_after_diffs || replanResponse.before_vs_after_diffs.length === 0) {
    return null;
  }

  const {
    trigger_observed,
    action_summary,
    agent_reasoning,
    before_vs_after_diffs = [],
    cost_delta = 0
  } = replanResponse;

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'SWAPPED_INDOOR':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'RESCHEDULED':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'RELAXED_PACE':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'TIME_ADJUSTED':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      default:
        return 'bg-teal-500/10 text-teal-500 border-teal-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-5 rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/5 via-slate-900/40 to-teal-500/5 shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-orange-500 text-white shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Autonomous Replan: BEFORE vs AFTER</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-mono font-bold border border-orange-500/30">
                ACTIVE DIFF
              </span>
            </h3>
            <p className="text-xs text-slate-400">{trigger_observed}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-400">Budget Impact</span>
          <span className={`block text-sm font-extrabold font-mono ${cost_delta > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {cost_delta >= 0 ? `+₹${cost_delta}` : `-₹${Math.abs(cost_delta)}`}
          </span>
        </div>
      </div>

      {/* Action Summary & AI Reasoning */}
      <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs space-y-1">
        <div className="flex items-center space-x-1.5 font-bold text-orange-600 dark:text-orange-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Replanner Agent Decision:</span>
        </div>
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{action_summary}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 font-mono">{agent_reasoning}</p>
      </div>

      {/* Diff Table List */}
      <div className="space-y-3">
        {before_vs_after_diffs.map((diff, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                ⏱️ {diff.slot_time}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle(diff.change_type)}`}>
                {diff.change_type.replace('_', ' ')}
              </span>
            </div>

            {/* Side by side before / after */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 line-through">
                <span className="text-[10px] font-bold uppercase text-rose-500 block mb-0.5">BEFORE:</span>
                {diff.original_activity}
              </div>

              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                <span className="text-[10px] font-bold uppercase text-emerald-500 block mb-0.5">AFTER (REPLANNED):</span>
                {diff.new_activity}
              </div>
            </div>

            {/* Reason */}
            <div className="flex items-start space-x-1.5 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
              <span><strong>Reason:</strong> {diff.reason}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
