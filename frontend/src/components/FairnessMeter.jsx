import React from 'react';
import { motion } from 'framer-motion';
import { Users, Scale, CheckCircle2 } from 'lucide-react';

export const FairnessMeter = ({ overallScore = 92, memberScores = {}, compromises = [] }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Group Fairness Equilibrium
            </h4>
            <p className="text-xs text-slate-400">Zero-conflict multi-preference optimizer</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-purple-500 font-mono">{overallScore}%</span>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Nash Fairness</span>
        </div>
      </div>

      {/* Member Score Bars */}
      <div className="space-y-3 mb-4">
        {Object.entries(memberScores).map(([name, score], idx) => (
          <div key={name} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700 dark:text-slate-300">{name}</span>
              <span className="text-purple-400 font-mono font-bold">{score}% Satisfaction</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Reconciled Compromises */}
      {compromises.length > 0 && (
        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AI Reconciled Compromises</span>
          </div>
          <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            {compromises.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
