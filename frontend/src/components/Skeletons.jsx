import React from 'react';

export const DestinationCardSkeleton = () => (
  <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-pulse">
    <div className="h-52 bg-slate-200 dark:bg-slate-800 w-full" />
    <div className="p-5 space-y-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
);

export const ItinerarySkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
  </div>
);
