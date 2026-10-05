import React from 'react';
import { Globe } from 'lucide-react';
import { useTripStore } from '../store/tripStore';

export const LanguageSwitcher = () => {
  const language = useTripStore((state) => state.language);
  const setLanguage = useTripStore((state) => state.setLanguage);

  const langs = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'te', label: 'తెలుగు' }
  ];

  return (
    <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
      <Globe className="w-3.5 h-3.5 ml-1 text-slate-400" />
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={`px-2 py-1 rounded-lg font-medium transition-all ${
            language === l.code
              ? 'bg-primary-500 text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
