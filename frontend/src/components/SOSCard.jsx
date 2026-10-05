import React from 'react';
import { ShieldAlert, PhoneCall, HeartPulse, Shield, HelpCircle } from 'lucide-react';

export const SOSCard = ({ emergencyInfo = {} }) => {
  const contacts = [
    { label: 'Hospital Emergency', value: emergencyInfo.hospital || '108 General Emergency', icon: HeartPulse, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Tourist Police', value: emergencyInfo.police || '100 / +91 Tourist Cell', icon: Shield, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'National Ambulance', value: emergencyInfo.ambulance || '108 (Toll Free)', icon: PhoneCall, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Women Helpline', value: emergencyInfo.women_helpline || '1091 (24x7)', icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
      <div className="flex items-center space-x-2 mb-3">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Emergency SOS & Helplines
          </h4>
          <p className="text-xs text-slate-400">Verified 24/7 verified local assistance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {contacts.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center space-x-2.5"
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] text-slate-400 font-medium">{c.label}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {c.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
