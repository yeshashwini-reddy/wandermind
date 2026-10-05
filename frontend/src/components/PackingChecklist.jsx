import React, { useState } from 'react';
import { CheckSquare, Square, PackageCheck, Sparkles } from 'lucide-react';

export const PackingChecklist = ({ items = [] }) => {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItem = (idx) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              AI Packing Checklist
            </h4>
            <p className="text-xs text-slate-400">Customized for weather & activities</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-primary-500 bg-primary-500/10 px-2 py-1 rounded-lg">
          {completedCount} / {items.length} Packed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-teal-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items list */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const isChecked = !!checkedItems[idx];
          return (
            <button
              key={idx}
              onClick={() => toggleItem(idx)}
              className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left text-xs transition-all ${
                isChecked
                  ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 line-through'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
              }`}
            >
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
