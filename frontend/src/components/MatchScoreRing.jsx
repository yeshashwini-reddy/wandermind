import React from 'react';
import { motion } from 'framer-motion';

export const MatchScoreRing = ({ score = 88, size = 64, strokeWidth = 6, showLabel = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 90) return '#10b981'; // emerald
    if (s >= 80) return '#f97316'; // orange
    return '#3b82f6'; // blue
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800"
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 font-mono">
          {score}%
        </span>
        {showLabel && size >= 70 && (
          <span className="text-[9px] uppercase font-bold text-slate-400">Match</span>
        )}
      </div>
    </div>
  );
};
