import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ShieldAlert, Sparkles, DollarSign,
  TrendingDown, TrendingUp, ShieldCheck, RefreshCw,
  Calendar, MapPin, Zap, BookOpen, Clock
} from 'lucide-react';
import { ExpenseTracker } from '../components/ExpenseTracker';
import { CostSplitter } from '../components/CostSplitter';
import { ReplanSimulator } from '../components/ReplanSimulator';
import { AgentActivityPanel } from '../components/AgentActivityPanel';
import { useTripStore } from '../store/tripStore';
import { getLiveTripApi } from '../api/client';
import toast from 'react-hot-toast';

export const LiveTrip = () => {
  const { id } = useParams();
  const tripId = id || useTripStore((state) => state.tripId);
  const liveTripData = useTripStore((state) => state.liveTripData);
  const setLiveTripData = useTripStore((state) => state.setLiveTripData);
  const itinerary = useTripStore((state) => state.itinerary);

  const [loading, setLoading] = useState(!liveTripData);

  useEffect(() => {
    loadLiveTrip();
  }, [tripId]);

  const loadLiveTrip = async () => {
    setLoading(true);
    try {
      const res = await getLiveTripApi(tripId);
      setLiveTripData(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load live trip metrics.");
    } finally {
      setLoading(false);
    }
  };

  const currentDestination = liveTripData?.destination_name || itinerary?.destination_name || "Goa";
  const totalBudget = liveTripData?.total_budget || 30000;
  const totalSpent = liveTripData?.total_spent || 1450;
  const remaining = liveTripData?.remaining_budget || (totalBudget - totalSpent);
  const dailyAllowance = liveTripData?.rebalanced_daily_allowance || Math.round(remaining / 2);
  const isOverspent = liveTripData?.overspend_detected || false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-teal-500 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Budget Guardian & Real-Time Monitor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Live Trip Dashboard: {currentDestination}
            </h1>
          </div>

          <button
            onClick={loadLiveTrip}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold glass-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-teal-500 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Telemetry</span>
          </button>
        </div>

        {/* Guardian Advice Callout */}
        {liveTripData?.budget_guardian_advice && (
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
            isOverspent
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
              : 'bg-teal-500/10 border-teal-500/30 text-teal-800 dark:text-teal-200'
          }`}>
            <strong>Budget Guardian Verdict:</strong> {liveTripData.budget_guardian_advice}
          </div>
        )}
      </div>

      {/* Real-Time Budget Health Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Allocated Budget</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ₹{Number(totalBudget).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Includes 10% safety buffer
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Spent So Far</span>
          <div className="text-2xl font-black text-orange-500 font-mono">
            ₹{Number(totalSpent).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">
            {Math.round((totalSpent / totalBudget) * 100)}% of total cap used
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Remaining Balance</span>
          <div className="text-2xl font-black text-emerald-500 font-mono">
            ₹{Number(remaining).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Emergency buffer 100% intact
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Rebalanced Daily Allowance</span>
          <div className="text-2xl font-black text-primary-500 font-mono">
            ₹{Number(dailyAllowance).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Auto-adjusted for remaining days</span>
        </div>
      </div>

      {/* Interactive Replanner Simulator on Live Trip */}
      <ReplanSimulator destinationId="goa" currentDay={1} />

      {/* Expenses Logger and Debt Splitter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <ExpenseTracker
            tripId={tripId}
            expenses={liveTripData?.recent_expenses || []}
            onExpenseAdded={(updatedState) => setLiveTripData(updatedState)}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <CostSplitter settlements={liveTripData?.settlements || []} />

          {/* Post-trip Memory Book Card */}
          <div className="glass-panel p-5 rounded-2xl border border-primary-500/20 bg-primary-500/5 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  AI Post-Trip Memory Book
                </h4>
                <p className="text-xs text-slate-400">Receipt Agent synthesizes photos & highlights</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              When your journey concludes, WanderMind generates a high-resolution memory scrapbook chronicling your route, meals, and real-time adaptations.
            </p>
            <button
              onClick={() => toast.success("Memory Book preview generated! Available at trip conclusion.")}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md transition-all"
            >
              Generate Digital Memory Book Preview
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Panel */}
      <AgentActivityPanel currentAgent="Budget Guardian & Expense Agent" />
    </div>
  );
};
