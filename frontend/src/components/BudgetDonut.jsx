import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldCheck } from 'lucide-react';

const COLORS = [
  '#f97316', // Travel (Orange)
  '#14b8a6', // Stay (Teal)
  '#3b82f6', // Food (Blue)
  '#a855f7', // Activities (Purple)
  '#10b981'  // Emergency Buffer (Emerald Green)
];

export const BudgetDonut = ({ totalBudget = 30000, breakdown }) => {
  const data = [
    { name: 'Travel (30%)', value: breakdown?.travel || Math.round(totalBudget * 0.3) },
    { name: 'Stay (30%)', value: breakdown?.stay || Math.round(totalBudget * 0.3) },
    { name: 'Food (20%)', value: breakdown?.food || Math.round(totalBudget * 0.2) },
    { name: 'Activities (10%)', value: breakdown?.activities || Math.round(totalBudget * 0.1) },
    { name: 'Emergency Buffer (10%)', value: breakdown?.emergency_buffer || Math.round(totalBudget * 0.1) },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
          Autonomous Budget Allocation
        </h4>
        <div className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>10% Safety Buffer Locked</span>
        </div>
      </div>

      <div className="h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Allocated']}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#fff',
                backdropFilter: 'blur(8px)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 font-medium">Total Cap</span>
          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            ₹{Number(totalBudget).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx] }} />
            <span className="text-slate-600 dark:text-slate-400 truncate">{item.name.split('(')[0]}:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 ml-auto">
              ₹{Number(item.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
