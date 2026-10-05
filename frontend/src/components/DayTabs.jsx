import React from 'react';
import { Calendar } from 'lucide-react';

export const DayTabs = ({ days = [], activeIndex = 1, onSelectDay }) => {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
      {days.map((day) => {
        const isActive = day.day_number === activeIndex;
        return (
          <button
            key={day.day_number}
            onClick={() => onSelectDay(day.day_number)}
            className={`flex flex-col items-start px-4 py-2.5 rounded-2xl text-left transition-all shrink-0 border ${
              isActive
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
                : 'glass-card text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-1 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Day {day.day_number}</span>
            </div>
            <span className={`text-[10px] truncate max-w-[140px] mt-0.5 ${
              isActive ? 'text-orange-100 font-medium' : 'text-slate-400'
            }`}>
              {day.theme.split('&')[0].trim()}
            </span>
          </button>
        );
      })}
    </div>
  );
};
