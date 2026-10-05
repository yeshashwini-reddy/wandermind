import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Users, Calendar, DollarSign, Compass, Heart,
  ArrowRight, ArrowLeft, Check, ShieldCheck, HelpCircle,
  Trees, Gift, ShieldAlert, Mountain, Coffee, Landmark,
  Music, Palmtree, Utensils, GraduationCap, Moon
} from 'lucide-react';
import { OCCASIONS, VIBES, DIETS, FEARS_LIST, PERSONALITY_QUIZ } from '../data/constants';
import { BudgetDonut } from '../components/BudgetDonut';
import { FairnessMeter } from '../components/FairnessMeter';
import { AgentActivityPanel } from '../components/AgentActivityPanel';
import { useTripStore } from '../store/tripStore';
import { callN8nTripAgentApi } from '../api/client';
import toast from 'react-hot-toast';

export const IntakeWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const intake = useTripStore((state) => state.intake);
  const updateIntake = useTripStore((state) => state.updateIntake);

  // Pre-fill destination from URL param if available
  useEffect(() => {
    const destParam = searchParams.get('dest') || searchParams.get('destination');
    if (destParam && destParam.trim()) {
      updateIntake({ destination: destParam.trim() });
    }
  }, [searchParams, updateIntake]);
  const setProfileValidation = useTripStore((state) => state.setProfileValidation);
  const setGroupConsensus = useTripStore((state) => state.setGroupConsensus);
  const setDestinations = useTripStore((state) => state.setDestinations);
  const setAgentResult = useTripStore((state) => state.setAgentResult);
  const addAgentEvent = useTripStore((state) => state.addAgentEvent);
  const tripId = useTripStore((state) => state.tripId);
  const groupConsensus = useTripStore((state) => state.groupConsensus);

  const isSolo = intake.occasion === "Solo" || intake.occasion === "Solo Explorer";
  const isHoneymoon = intake.occasion === "Honeymoon" || intake.occasion === "Romantic Honeymoon";

  const totalSteps = 6;

  const handleNext = () => {
    if (intake.occasion === "Solo" || intake.occasion === "Solo Explorer") {
      if (intake.travelers_count !== 1) updateIntake({ travelers_count: 1 });
    } else if (intake.occasion === "Honeymoon" || intake.occasion === "Romantic Honeymoon") {
      if (intake.travelers_count !== 2) updateIntake({ travelers_count: 2 });
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleVibeToggle = (vibeId) => {
    const current = intake.vibes || [];
    if (current.includes(vibeId)) {
      updateIntake({ vibes: current.filter((v) => v !== vibeId) });
    } else {
      updateIntake({ vibes: [...current, vibeId] });
    }
  };

  const handleFearToggle = (fear) => {
    const current = intake.fears || [];
    if (current.includes(fear)) {
      updateIntake({ fears: current.filter((f) => f !== fear) });
    } else {
      updateIntake({ fears: [...current, fear] });
    }
  };

  const handleQuizAnswer = (questionId, trait) => {
    updateIntake({
      personality_quiz_answers: {
        ...(intake.personality_quiz_answers || {}),
        [questionId]: trait
      }
    });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    toast.loading("WanderMind is researching your trip...", { id: "submit-toast" });

    // Safeguard: Ensure fixed traveler counts before calling APIs
    let sanitizedIntake = { ...intake };
    if (sanitizedIntake.occasion === "Solo" || sanitizedIntake.occasion === "Solo Explorer") {
      sanitizedIntake.travelers_count = 1;
      updateIntake({ travelers_count: 1 });
    } else if (sanitizedIntake.occasion === "Honeymoon" || sanitizedIntake.occasion === "Romantic Honeymoon") {
      sanitizedIntake.travelers_count = 2;
      updateIntake({ travelers_count: 2 });
    }

    // Map priority
    const priorityMap = {
      'fastest': 'fastest',
      'cheapest': 'cheapest',
      'comfort': 'comfort',
      'balanced': 'balanced',
      'best_value': 'balanced'
    };
    const mappedPriority = priorityMap[sanitizedIntake.priority?.toLowerCase()] || 'comfort';

    // Build n8n production webhook payload
    const n8nPayload = {
      origin: sanitizedIntake.start_city || "Hyderabad",
      destination: sanitizedIntake.destination || "Delhi",
      travel_date: sanitizedIntake.start_date || "2026-10-15",
      budget: Number(sanitizedIntake.total_budget || 12000),
      travelers: Number(sanitizedIntake.travelers_count || 2),
      priority: mappedPriority,
      duration_days: Number(sanitizedIntake.duration_days || 4)
    };

    // Emit live agent activity events for UI feedback
    addAgentEvent({
      id: Date.now(),
      agent_name: "Coordinator Agent",
      timestamp: new Date().toLocaleTimeString(),
      step: `Synthesizing ${n8nPayload.travelers} traveler(s) preferences for ${n8nPayload.destination}...`
    });

    addAgentEvent({
      id: Date.now() + 1,
      agent_name: "Research Agent",
      timestamp: new Date().toLocaleTimeString(),
      step: "Triggering n8n AI Agent Mesh (Flights, Hotels, Images, Videos)...",
      tool_called: "n8n Webhook"
    });

    try {
      // 1. Trigger n8n AI Agent Webhook
      const agentResponse = await callN8nTripAgentApi(n8nPayload);
      setAgentResult(agentResponse);

      addAgentEvent({
        id: Date.now() + 2,
        agent_name: "Coordinator Agent",
        timestamp: new Date().toLocaleTimeString(),
        step: "AI Trip research synthesized successfully!"
      });

      toast.success("Trip research completed by WanderMind AI!", { id: "submit-toast" });
      navigate('/destinations');
    } catch (err) {
      console.error("[WanderMind] n8n AI Agent request failed:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      addAgentEvent({
        id: Date.now() + 3,
        agent_name: "System Alert",
        timestamp: new Date().toLocaleTimeString(),
        step: `n8n webhook error (${err.response?.status || err.message}). Check console.`
      });

      toast.error("WanderMind AI Agent encountered an issue. Please try again.", { id: "submit-toast" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Progress Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-primary-500 font-bold uppercase tracking-wider">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {currentStep === 1 && "Occasion & Persona"}
            {currentStep === 2 && "Travelers & Mobility Constraints"}
            {currentStep === 3 && "Dates & Starting City"}
            {currentStep === 4 && "Autonomous Budget Allocation"}
            {currentStep === 5 && "Vibes, Diets & Safety Preferences"}
            {currentStep === 6 && "Personality Quiz & Group Mode"}
          </span>
        </div>

        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Multi-Step Form Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl min-h-[440px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STEP 1: Occasion */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  What is the occasion for this trip?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Profile Agent tailors pacing, romance, activity intensity, and accommodation type.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {OCCASIONS.map((occ) => {
                  const isSelected = intake.occasion === occ.id;
                  return (
                    <button
                      key={occ.id}
                      onClick={() => updateIntake({ occasion: occ.id })}
                      className={`p-4 rounded-2xl glass-card border text-left transition-all flex flex-col justify-between space-y-2 hover:-translate-y-1 ${
                        isSelected
                          ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-500/5 shadow-md'
                          : 'border-slate-200/80 dark:border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">
                          {occ.id === "Family" && "👨‍👩‍👧‍👦"}
                          {occ.id === "Honeymoon" && "💍"}
                          {occ.id === "Friends" && "🎉"}
                          {occ.id === "Solo" && "🎒"}
                          {occ.id === "Pilgrimage" && "🛕"}
                          {occ.id === "School trip" && "🚌"}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-primary-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{occ.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{occ.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Travelers & Mobility */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Who is traveling?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enforces accessibility and speed intervals.
                </p>
              </div>

              {/* Number of Travelers */}
              {isSolo ? (
                <div className="p-5 rounded-2xl glass-card border border-primary-500/30 bg-primary-500/5 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary-500">
                    <span>👤 SOLO TRIP</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    1 Traveler
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Traveler count is fixed for Solo Explorer.
                  </p>
                </div>
              ) : isHoneymoon ? (
                <div className="p-5 rounded-2xl glass-card border border-primary-500/30 bg-primary-500/5 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary-500">
                    <span>💍 HONEYMOON</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    2 Travelers
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Traveler count is fixed for a Romantic Honeymoon.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Travelers Count: <span className="text-primary-500 font-mono text-base">{intake.travelers_count} Persons</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={intake.travelers_count}
                    onChange={(e) => updateIntake({ travelers_count: parseInt(e.target.value) })}
                    className="w-full accent-primary-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Toggles */}
              {!isSolo && !isHoneymoon && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => updateIntake({ elder_mode: !intake.elder_mode, has_elders: !intake.has_elders })}
                    className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all ${
                      intake.elder_mode ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">👴 Elder Mode</span>
                      <input type="checkbox" checked={intake.elder_mode} readOnly className="accent-primary-500" />
                    </div>
                    <p className="text-[11px] text-slate-400">Step-free access, relaxed afternoon tea intervals</p>
                  </div>

                  <div
                    onClick={() => updateIntake({ kid_mode: !intake.kid_mode, has_kids: !intake.has_kids })}
                    className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all ${
                      intake.kid_mode ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">👶 Kid Friendly</span>
                      <input type="checkbox" checked={intake.kid_mode} readOnly className="accent-primary-500" />
                    </div>
                    <p className="text-[11px] text-slate-400">Parks, interactive museums & kid-safe dining</p>
                  </div>

                  <div
                    onClick={() => updateIntake({ mobility_limits: !intake.mobility_limits })}
                    className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all ${
                      intake.mobility_limits ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">♿ Wheelchair Access</span>
                      <input type="checkbox" checked={intake.mobility_limits} readOnly className="accent-primary-500" />
                    </div>
                    <p className="text-[11px] text-slate-400">Ramp compliance & elevator-verified stays</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Dates & City */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  When and from where?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Destination Agent evaluates seasonal weather & transit proximity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Starting City (Origin)</label>
                  <input
                    type="text"
                    value={intake.start_city || ''}
                    placeholder="e.g. Hyderabad"
                    onChange={(e) => updateIntake({ start_city: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Destination City</label>
                  <input
                    type="text"
                    value={intake.destination || ''}
                    placeholder="e.g. Delhi or Goa"
                    onChange={(e) => updateIntake({ destination: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Departure Date</label>
                  <input
                    type="date"
                    value={intake.start_date || ''}
                    onChange={(e) => updateIntake({ start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Duration: <span className="text-primary-500 font-mono">{intake.duration_days} Days</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={intake.duration_days || 4}
                    onChange={(e) => updateIntake({ duration_days: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Travel Priority</label>
                  <select
                    value={intake.priority || 'comfort'}
                    onChange={(e) => updateIntake({ priority: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="comfort">Comfort (Balanced Pace & Quality)</option>
                    <option value="fastest">Fastest (Time-Saving & Direct)</option>
                    <option value="cheapest">Cheapest (Budget-Optimized)</option>
                    <option value="balanced">Balanced (Optimal Value)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Budget Slider & Donut */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Set Your Trip Budget
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Budget Guardian automatically locks a 10% emergency safety buffer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Budget (INR)</span>
                    <div className="text-3xl font-black text-primary-500 font-mono">
                      ₹{Number(intake.total_budget).toLocaleString()}
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="150000"
                      step="5000"
                      value={intake.total_budget}
                      onChange={(e) => updateIntake({ total_budget: parseFloat(e.target.value) })}
                      className="w-full accent-primary-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>₹10,000 (Budget)</span>
                      <span>₹75,000 (Mid-tier)</span>
                      <span>₹1,50,000 (Luxury)</span>
                    </div>
                  </div>
                </div>

                {/* Animated Budget Donut */}
                <BudgetDonut totalBudget={intake.total_budget} />
              </div>
            </motion.div>
          )}

          {/* STEP 5: Vibes, Diets, Fears, Eco */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Vibes & Dietary Standards
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Strict dietary matching and fear avoidance logic.
                </p>
              </div>

              {/* Vibes Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Desired Vibes:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {VIBES.map((v) => {
                    const isSelected = intake.vibes?.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVibeToggle(v.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                          isSelected
                            ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                            : 'glass-card text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span>{v.label.split('&')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diet Options */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dietary Requirement (Hard Constraint):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIETS.map((d) => {
                    const isSelected = intake.diet === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => updateIntake({ diet: d.id })}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold'
                            : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-xs block">{d.label}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{d.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fears & Dislikes */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avoid Specific Dislikes / Fears:</span>
                <div className="flex flex-wrap gap-2">
                  {FEARS_LIST.map((fear) => {
                    const isSelected = intake.fears?.includes(fear);
                    return (
                      <button
                        key={fear}
                        onClick={() => handleFearToggle(fear)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/40 font-bold'
                            : 'glass-card text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        🚫 {fear}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: Quiz, Group Mode & Surprise Me */}
          {currentStep === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Travel Quiz & Extra Intelligent Modes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enable Group Consensus or Surprise Me modes.
                </p>
              </div>

              {/* Extra Modes Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => updateIntake({ group_mode: !intake.group_mode })}
                  className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all ${
                    intake.group_mode ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/30' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Group Consensus Mode
                    </span>
                    <input type="checkbox" checked={intake.group_mode} readOnly className="accent-purple-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">Takes 4 friend profiles, resolves conflicting vibes, and computes Nash fairness scores.</p>
                </div>

                <div
                  onClick={() => updateIntake({ surprise_me: !intake.surprise_me })}
                  className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all ${
                    intake.surprise_me ? 'border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/30' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <Gift className="w-4 h-4" />
                      "Surprise Me" Mode
                    </span>
                    <input type="checkbox" checked={intake.surprise_me} readOnly className="accent-teal-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">Destination hidden initially, revealed day-by-day with clue countdowns.</p>
                </div>
              </div>

              {/* Mini Quiz */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Travel Personality Quiz (Sample 1 of 5):</span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{PERSONALITY_QUIZ[0].question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERSONALITY_QUIZ[0].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer('q1', opt.trait)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          intake.personality_quiz_answers?.q1 === opt.trait
                            ? 'bg-primary-500 text-white border-primary-500 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 flex items-center space-x-1.5 transition-all hover:scale-105"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 shadow-xl shadow-orange-500/25 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>{isSubmitting ? "Orchestrating Agents..." : "Generate AI Destination Recommendations"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Telemetry */}
      <AgentActivityPanel currentAgent="Profile & Consensus Agents" compact={true} />
    </div>
  );
};
