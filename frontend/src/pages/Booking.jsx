import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, ShieldCheck, AlertTriangle, ArrowRight, Plane, Hotel,
  Search, Calendar, Clock, Users, DollarSign, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { TransportCard } from '../components/TransportCard';
import { BookingOptionCard } from '../components/BookingOptionCard';
import { AgentActivityPanel } from '../components/AgentActivityPanel';
import { useTripStore } from '../store/tripStore';
import toast from 'react-hot-toast';

export const Booking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tripId = id || useTripStore((state) => state.tripId);
  const intake = useTripStore((state) => state.intake);
  const flightResults = useTripStore((state) => state.flightResults);
  const hotelResults = useTripStore((state) => state.hotelResults);
  const selectedFlight = useTripStore((state) => state.selectedFlight);
  const setSelectedFlight = useTripStore((state) => state.setSelectedFlight);
  const selectedHotel = useTripStore((state) => state.selectedHotel);
  const setSelectedHotel = useTripStore((state) => state.setSelectedHotel);

  const initialDest = searchParams.get('dest') || intake.destination || 'Goa';

  // Core Trip Inputs (to be sent to n8n AI Agent webhook)
  const [originInput, setOriginInput] = useState(intake.start_city || 'New Delhi');
  const [destInput, setDestInput] = useState(initialDest);
  const [dateInput, setDateInput] = useState(intake.start_date || '2026-11-10');
  const [durationInput, setDurationInput] = useState(intake.duration_days || 3);
  const [travelersInput, setTravelersInput] = useState(intake.travelers_count || 2);
  const [budgetInput, setBudgetInput] = useState(intake.total_budget || 30000);
  const [priorityInput, setPriorityInput] = useState('best_value'); // 'fastest', 'cheapest', 'best_value'
  const [naturalQuery, setNaturalQuery] = useState(
    `Plan a trip from ${intake.start_city || 'New Delhi'} to ${initialDest} for ${intake.travelers_count || 2} travelers with a budget of ₹${intake.total_budget || 30000}.`
  );

  const [isSearching, setIsSearching] = useState(false);

  // Sync inputs when intake changes
  useEffect(() => {
    if (intake.start_city) setOriginInput(intake.start_city);
    if (intake.start_date) setDateInput(intake.start_date);
    if (intake.duration_days) setDurationInput(intake.duration_days);
    if (intake.travelers_count) setTravelersInput(intake.travelers_count);
    if (intake.total_budget) setBudgetInput(intake.total_budget);
  }, [intake]);

  const handleSearch = () => {
    setIsSearching(true);
    toast.success("Trip parameters updated. Ready for n8n AI Agent search.");
    setTimeout(() => {
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* Header & Travel Search Console */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>n8n AI Agent Travel Search</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Flights & Hotels Search
            </h1>
            <p className="text-xs text-slate-400">
              Autonomous SerpApi integration for Google Flights and Google Hotels with AI reasoning.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              Trip ID: <code className="text-primary-400 font-mono">{tripId}</code>
            </span>
          </div>
        </div>

        {/* Natural Language Prompt Search Bar */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary-400" />
            <span>Trip Request (Natural Language Context)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="e.g. Flight from New Delhi to Goa for 2 travelers. Budget ₹30,000. Best value options."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSearching ? 'Preparing Request...' : 'Search Flights & Hotels'}</span>
            </button>
          </div>
        </div>

        {/* Structured Parameter Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-800/60 text-xs">
          {/* Origin */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Origin</label>
            <input
              type="text"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
            />
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Destination</label>
            <input
              type="text"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
            />
          </div>

          {/* Travel Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Travel Date</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Duration (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={durationInput}
              onChange={(e) => setDurationInput(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
            />
          </div>

          {/* Travelers */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Travelers</label>
            <input
              type="number"
              min="1"
              max="20"
              value={travelersInput}
              onChange={(e) => setTravelersInput(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
            />
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Budget (₹)</label>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold font-mono"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Priority</label>
            <select
              value={priorityInput}
              onChange={(e) => setPriorityInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
            >
              <option value="best_value">Best Value</option>
              <option value="cheapest">Cheapest</option>
              <option value="fastest">Fastest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Results Grid: Flight Recommendations & Hotel Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Google Flights Recommendations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary-400" />
              <span>Flight Recommendations (Google Flights)</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {flightResults.length} Options
            </span>
          </div>

          {flightResults.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <Plane className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
              <h3 className="font-bold text-sm text-slate-300">Ready for Live Flight Search</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Search Google Flights via SerpApi through the n8n AI Agent backend with verified live pricing and schedules.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flightResults.map((flight, idx) => (
                <TransportCard
                  key={flight.id || idx}
                  option={flight}
                  travelersCount={travelersInput}
                  isSelected={selectedFlight?.id === flight.id}
                  onSelect={() => setSelectedFlight(flight)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Google Hotels Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Hotel className="w-5 h-5 text-teal-400" />
              <span>Hotel Recommendations (Google Hotels)</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {hotelResults.length} Options
            </span>
          </div>

          {hotelResults.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <Hotel className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
              <h3 className="font-bold text-sm text-slate-300">Ready for Live Hotel Search</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Search Google Hotels via SerpApi through the n8n AI Agent backend with verified amenities and ratings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hotelResults.map((hotel, idx) => (
                <BookingOptionCard
                  key={hotel.id || idx}
                  option={hotel}
                  isSelected={selectedHotel?.id === hotel.id}
                  onSelect={() => setSelectedHotel(hotel)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Telemetry / Agent Activity Panel */}
      <AgentActivityPanel currentAgent="n8n Travel Orchestrator" />
    </div>
  );
};
