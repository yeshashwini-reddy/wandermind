import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Sparkles, BookOpen, Umbrella,
  CreditCard, ArrowRight, ShieldCheck, Utensils,
  AlertTriangle, CheckSquare, PhoneCall, Layers, Globe
} from 'lucide-react';
import { DayTabs } from '../components/DayTabs';
import { TimelineItem } from '../components/TimelineItem';
import { LeafletRouteMap } from '../components/LeafletRouteMap';
import { PackingChecklist } from '../components/PackingChecklist';
import { SOSCard } from '../components/SOSCard';
import { ReplanSimulator } from '../components/ReplanSimulator';
import { BeforeAfterDiff } from '../components/BeforeAfterDiff';
import { StoryModeModal } from '../components/StoryModeModal';
import { AgentActivityPanel } from '../components/AgentActivityPanel';
import { ItinerarySkeleton } from '../components/Skeletons';
import { useTripStore } from '../store/tripStore';
import { generateItineraryApi } from '../api/client';
import toast from 'react-hot-toast';

export const Itinerary = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tripId = id || useTripStore((state) => state.tripId);
  const intake = useTripStore((state) => state.intake);
  const selectedDestination = useTripStore((state) => state.selectedDestination);
  const itinerary = useTripStore((state) => state.itinerary);
  const setItinerary = useTripStore((state) => state.setItinerary);
  const activeDayIndex = useTripStore((state) => state.activeDayIndex);
  const setActiveDayIndex = useTripStore((state) => state.setActiveDayIndex);
  const latestReplanResponse = useTripStore((state) => state.latestReplanResponse);
  const storyModeOpen = useTripStore((state) => state.storyModeOpen);
  const setStoryModeOpen = useTripStore((state) => state.setStoryModeOpen);

  const [loading, setLoading] = useState(!itinerary);
  const [isPlanBActive, setIsPlanBActive] = useState(false);

  const destinationId = searchParams.get('dest') || selectedDestination?.id || 'goa';

  useEffect(() => {
    if (!itinerary || itinerary.destination_id !== destinationId) {
      loadItinerary();
    }
  }, [destinationId]);

  const loadItinerary = async () => {
    setLoading(true);
    try {
      const res = await generateItineraryApi(destinationId, intake, tripId);
      setItinerary(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate itinerary.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !itinerary) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ItinerarySkeleton />
      </div>
    );
  }

  const currentDayPlan = itinerary.days.find((d) => d.day_number === activeDayIndex) || itinerary.days[0];
  const activeTimeline = isPlanBActive && currentDayPlan.plan_b_timeline
    ? currentDayPlan.plan_b_timeline
    : currentDayPlan.timeline;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">
                Itinerary Agent Orchestration
              </span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                🛡️ {intake.diet} Diet & Elder Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {itinerary.destination_name} • {itinerary.duration_days} Days Master Plan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estimated Total: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{Number(itinerary.estimated_cost).toLocaleString()}</span> (Within budget of ₹{Number(itinerary.total_budget).toLocaleString()})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setStoryModeOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold glass-card border border-primary-500/40 text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Story Mode (Narrative + Audio)</span>
            </button>

            <button
              onClick={() => navigate(`/booking/${tripId}?dest=${destinationId}`)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 flex items-center space-x-1.5 transition-all hover:scale-105"
            >
              <CreditCard className="w-4 h-4" />
              <span>Find Best Booking Deals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME REPLANNER SIMULATOR (KEY FEATURE) */}
      <ReplanSimulator destinationId={destinationId} currentDay={activeDayIndex} />

      {/* BEFORE VS AFTER DIFF (Appears after replan trigger) */}
      {latestReplanResponse && (
        <BeforeAfterDiff replanResponse={latestReplanResponse} />
      )}

      {/* Day Tabs and Plan B Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <DayTabs
          days={itinerary.days}
          activeIndex={activeDayIndex}
          onSelectDay={(dayNum) => setActiveDayIndex(dayNum)}
        />

        {/* Plan B Toggle */}
        <button
          onClick={() => setIsPlanBActive(!isPlanBActive)}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 shrink-0 ${
            isPlanBActive
              ? 'bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20'
              : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500'
          }`}
        >
          <Umbrella className="w-4 h-4" />
          <span>{isPlanBActive ? "Showing Rain Plan B" : "Toggle All-Weather Plan B"}</span>
        </button>
      </div>

      {/* Day Summary Card */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {currentDayPlan.title}: {currentDayPlan.theme}
          </span>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{currentDayPlan.day_summary}</p>
        </div>
        <span className="text-[11px] font-mono text-primary-500 font-bold shrink-0 bg-primary-500/10 px-2.5 py-1 rounded-lg">
          Transit: {currentDayPlan.travel_time_between_stops}
        </span>
      </div>

      {/* Main Grid: Timeline + Map & Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hour-by-Hour Activity Timeline
            </h3>
            <span className="text-xs text-slate-400">
              {activeTimeline.length} Curated Stops
            </span>
          </div>

          <div className="pt-2">
            {activeTimeline.map((activity, idx) => (
              <TimelineItem
                key={activity.id || idx}
                activity={activity}
                index={idx}
                isPlanB={isPlanBActive}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Route Map + Guides + SOS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Route Map */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary-500" />
              Day {activeDayIndex} Route Map
            </h3>
            <LeafletRouteMap activities={activeTimeline} />
          </div>

          {/* Packing Checklist */}
          <PackingChecklist items={itinerary.packing_checklist} />

          {/* Food Guide */}
          {itinerary.food_guide && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Diet-Matched Regional Food Guide
                  </h4>
                  <p className="text-xs text-slate-400">Verified local specialties for {intake.diet}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {itinerary.food_guide.veg_options && (
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Vegetarian Specialties:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{itinerary.food_guide.veg_options.join(', ')}</p>
                  </div>
                )}
                {itinerary.food_guide.jain_options && intake.diet === "Jain" && (
                  <div>
                    <span className="font-bold text-purple-600 dark:text-purple-400">Strict Jain Preparations:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{itinerary.food_guide.jain_options.join(', ')}</p>
                  </div>
                )}
                {itinerary.food_guide.famous_cafes && (
                  <div className="pt-1">
                    <span className="font-bold text-primary-600 dark:text-primary-400">Iconic Cafes:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{itinerary.food_guide.famous_cafes.join(' • ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Precautions & Etiquette */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Safety Precautions & Local Etiquette
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              {itinerary.precautions?.slice(0, 3).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {/* Emergency SOS Card */}
          <SOSCard emergencyInfo={itinerary.emergency_info} />
        </div>
      </div>

      {/* Story Mode Modal */}
      <StoryModeModal
        isOpen={storyModeOpen}
        onClose={() => setStoryModeOpen(false)}
        destinationName={itinerary.destination_name}
        storyText={itinerary.story_mode_narrative}
        translations={itinerary.translations}
      />

      {/* Real-time Agent Activity Stream */}
      <AgentActivityPanel currentAgent="Itinerary Routing & Replanner Agent" />
    </div>
  );
};
