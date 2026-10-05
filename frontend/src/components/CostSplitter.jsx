import React from 'react';
import { Users, ArrowRight, CheckCircle } from 'lucide-react';

export const CostSplitter = ({ settlements = [] }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Group Cost Splitter ("Who Owes Whom")
          </h4>
          <p className="text-xs text-slate-400">Simplified debt graph resolution algorithm</p>
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-center text-xs text-slate-400">
          All group expenses are currently balanced. Zero pending debts.
        </div>
      ) : (
        <div className="space-y-2">
          {settlements.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {s.from_member}
                </span>
                <div className="flex items-center text-primary-500 font-medium">
                  <span className="text-[10px] mr-1 font-mono">owes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  {s.to_member}
                </span>
              </div>

              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                ₹{Number(s.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
