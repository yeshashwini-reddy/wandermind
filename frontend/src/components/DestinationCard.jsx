import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, Users, Shield, ArrowRight, Sparkles, Check, Thermometer, Wind } from 'lucide-react';
import { MatchScoreRing } from './MatchScoreRing';

export const DestinationCard = ({ destination, onSelect, isSelected = false }) => {
  const [selectedTier, setSelectedTier] = useState('balanced');
  const [imgSrc, setImgSrc] = useState(`/images/${destination.id}.jpg`);

  const {
    id,
    name,
    tagline,
    hero_image,
    match_score,
    match_reasons = [],
    best_season,
    current_weather = {},
    crowd_level,
    safety_score,
    tier_costs = {},
    suitable_for_elders,
    suitable_for_kids,
    tags = []
  } = destination;

  const cost = tier_costs[selectedTier] || destination.estimated_total_cost;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className={`glass-card rounded-3xl overflow-hidden flex flex-col border transition-all ${
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-xl shadow-primary-500/10'
          : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-md'
      }`}
    >
      {/* Image Header with Match Ring Overlay & Bottom Gradient */}
      <div className="relative h-56 w-full overflow-hidden group bg-slate-900">
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => {
            if (hero_image && imgSrc !== hero_image) {
              setImgSrc(hero_image);
            }
          }}
        />
        {/* Bottom Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900/85 text-white backdrop-blur-md border border-white/15 shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Floating Match Score Ring */}
        <div className="absolute top-3.5 right-3.5 p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 shadow-lg">
          <MatchScoreRing score={match_score} size={58} strokeWidth={5} />
        </div>

        {/* Bottom Image Overlay Info */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white space-y-0.5">
          <h3 className="text-xl font-extrabold tracking-tight drop-shadow-md">{name}</h3>
          <p className="text-xs text-slate-200 line-clamp-1 opacity-90 drop-shadow-sm">{tagline}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Quick Weather & Safety Pill Bar */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
            <Thermometer className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-semibold">{current_weather.temp || 26}°C</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span className="truncate">{crowd_level}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold">{safety_score}/100</span>
          </div>
        </div>

        {/* Demo Data indicator if mock weather is active */}
        {current_weather.is_demo_data && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center justify-end font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-pulse"></span>
            Demo Weather Engine
          </div>
        )}

        {/* Match Reasons List */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Why WanderMind AI Chose This:
          </span>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {match_reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Tiers (Budget / Balanced / Premium) */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Trip Cost:</span>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px]">
              {['budget', 'balanced', 'premium'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2 py-0.5 rounded-lg capitalize font-medium transition-colors ${
                    selectedTier === tier
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₹{Number(cost).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">All-inclusive total</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(destination)}
          className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 transition-all hover:scale-[1.02]"
        >
          <span>View Custom Itinerary</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
