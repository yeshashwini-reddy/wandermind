import React, { useState } from 'react';
import { CloudRain, Ban, Clock, AlertTriangle, BatteryLow, Compass, Sparkles, Loader2, Navigation } from 'lucide-react';
import { replanTripApi, whatNowApi } from '../api/client';
import { useTripStore } from '../store/tripStore';
import toast from 'react-hot-toast';

export const ReplanSimulator = ({ destinationId = "goa", currentDay = 1 }) => {
  const tripId = useTripStore((state) => state.tripId);
  const isReplanning = useTripStore((state) => state.isReplanning);
  const setIsReplanning = useTripStore((state) => state.setIsReplanning);
  const setReplanResult = useTripStore((state) => state.setReplanResult);

  const [whatNowResults, setWhatNowResults] = useState(null);
  const [loadingWhatNow, setLoadingWhatNow] = useState(false);

  const triggers = [
    { id: "rain", label: "It's Raining", icon: CloudRain, color: "hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10", desc: "Swap outdoor beach/forts with sheltered museums" },
    { id: "place_closed", label: "Place Closed", icon: Ban, color: "hover:border-rose-500 hover:text-rose-500 hover:bg-rose-500/10", desc: "Reroute to nearby 4.8★ attraction within 400m" },
    { id: "train_delayed_2h", label: "Train Delayed 2h", icon: Clock, color: "hover:border-amber-500 hover:text-amber-500 hover:bg-amber-500/10", desc: "Compact morning stops & synchronize check-in" },
    { id: "missed_connection", label: "Missed Transit", icon: AlertTriangle, color: "hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/10", desc: "Hold reservations & reroute next connection" },
    { id: "im_tired", label: "I'm Tired", icon: BatteryLow, color: "hover:border-purple-500 hover:text-purple-500 hover:bg-purple-500/10", desc: "Reduce walking 70% with serene wellness tea" },
    { id: "free_2_hours", label: "2 Free Hours", icon: Compass, color: "hover:border-teal-500 hover:text-teal-500 hover:bg-teal-500/10", desc: "Inject spontaneous artisanal pottery masterclass" },
  ];

  const handleTriggerReplan = async (triggerId) => {
    setIsReplanning(true);
    toast.loading(`Replanner Agent observing event: ${triggerId.replace('_', ' ')}...`, { id: 'replan-toast' });

    try {
      const res = await replanTripApi({
        trip_id: tripId,
        destination_id: destinationId,
        current_day: currentDay,
        trigger_type: triggerId,
        notes: "User initiated real-time simulation"
      });

      setReplanResult(res);
      toast.success("Itinerary dynamically re-scored and updated!", { id: 'replan-toast' });
    } catch (err) {
      console.error(err);
      toast.error("Replanner agent failed to sync.", { id: 'replan-toast' });
      setIsReplanning(false);
    }
  };

  const handleWhatNow = async () => {
    setLoadingWhatNow(true);
    try {
      const res = await whatNowApi({
        destination_id: destinationId,
        current_lat: 15.2993,
        current_lng: 74.1240,
        time_available_hours: 2.0,
        diet: "Veg",
        has_elders: true
      });
      setWhatNowResults(res);
      toast.success("Discovered 3 immediate nearby options!");
    } catch (err) {
      console.error(err);
      toast.error("What Now search failed.");
    } finally {
      setLoadingWhatNow(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-orange-500/30 bg-orange-500/5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-orange-500 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Real-Time Dynamic Replanner Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test how WanderMind's autonomous agent rebalances Day {currentDay} when reality changes
          </p>
        </div>

        {/* What Now Button */}
        <button
          onClick={handleWhatNow}
          disabled={loadingWhatNow}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md shadow-teal-500/20 transition-all hover:scale-105 shrink-0"
        >
          {loadingWhatNow ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>What Now? Radar</span>
        </button>
      </div>

      {/* Simulator Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {triggers.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              disabled={isReplanning}
              onClick={() => handleTriggerReplan(t.id)}
              className={`p-3 rounded-xl glass-card border border-slate-200/80 dark:border-slate-800/80 text-left transition-all flex flex-col justify-between space-y-2 hover:-translate-y-1 ${t.color}`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-mono text-slate-400">Trigger</span>
              </div>
              <div>
                <span className="block font-bold text-xs text-slate-800 dark:text-slate-200">
                  {t.label}
                </span>
                <span className="block text-[10px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
                  {t.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* What Now Radar Results Popup */}
      {whatNowResults && (
        <div className="mt-4 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-teal-700 dark:text-teal-300">
              {whatNowResults.current_context}
            </span>
            <button
              onClick={() => setWhatNowResults(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 font-bold"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {whatNowResults.recommendations.map((rec, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-teal-500/20">
                <p className="font-bold text-slate-800 dark:text-slate-100">{rec.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{rec.description}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                  <span>{rec.distance_km * 1000}m Away • {rec.duration_mins} mins</span>
                  <span>₹{rec.estimated_cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
