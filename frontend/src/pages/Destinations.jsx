import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Plane, Hotel, ShieldCheck,
  ExternalLink, ArrowRight, Compass, MapPin
} from 'lucide-react';
import { AgentActivityPanel } from '../components/AgentActivityPanel';
import { DestinationRealLifeGallery } from '../components/DestinationRealLifeGallery';
import { useTripStore } from '../store/tripStore';

// Curated 12 Indian & International Destinations
const EXPLORE_DESTINATIONS = [
  // INDIA
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    region: 'india',
    tag: 'India • Beach',
    tagColor: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/30',
    description: 'Beaches, sunsets, nightlife and laid-back coastal escapes.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/goa.jpg'
  },
  {
    id: 'kashmir',
    name: 'Kashmir',
    country: 'India',
    region: 'india',
    tag: 'India • Mountains',
    tagColor: 'from-sky-500/20 to-cyan-500/20 text-sky-300 border-sky-500/30',
    description: 'Snow-capped mountains, peaceful valleys and breathtaking landscapes.',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/manali.jpg'
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    region: 'india',
    tag: 'India • Heritage',
    tagColor: 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30',
    description: 'Royal palaces, vibrant markets and timeless Rajasthani culture.',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/jaipur.jpg'
  },
  {
    id: 'kerala',
    name: 'Kerala',
    country: 'India',
    region: 'india',
    tag: 'India • Nature',
    tagColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Backwaters, lush landscapes and peaceful tropical experiences.',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/kerala.jpg'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    region: 'india',
    tag: 'India • City',
    tagColor: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30',
    description: 'A vibrant mix of coastline, culture, food and city life.',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/goa.jpg'
  },
  {
    id: 'delhi',
    name: 'Delhi',
    country: 'India',
    region: 'india',
    tag: 'India • Culture',
    tagColor: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    description: "Historic monuments, incredible food and the heart of India's capital.",
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/wonders/taj_mahal.jpg'
  },

  // INTERNATIONAL
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    region: 'international',
    tag: 'International • Luxury',
    tagColor: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30',
    description: 'Luxury skylines, desert adventures and futuristic city experiences.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/wonders/petra.jpg'
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    region: 'international',
    tag: 'International • City',
    tagColor: 'from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30',
    description: 'A futuristic city of gardens, architecture, food and entertainment.',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/coorg.jpg'
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    region: 'international',
    tag: 'International • Culture',
    tagColor: 'from-orange-500/20 to-rose-500/20 text-orange-300 border-orange-500/30',
    description: 'Street food, temples, markets and energetic city life.',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/varanasi.jpg'
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'international',
    tag: 'International • Tropical',
    tagColor: 'from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Tropical beaches, temples, rice terraces and island adventures.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/munnar.jpg'
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'international',
    tag: 'International • Europe',
    tagColor: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
    description: 'Iconic landmarks, art, architecture and unforgettable European charm.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/wonders/colosseum.jpg'
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Maldives',
    region: 'international',
    tag: 'International • Beach',
    tagColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Crystal-clear waters, island resorts and peaceful tropical escapes.',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/andaman.jpg'
  }
];

export const Destinations = () => {
  const navigate = useNavigate();
  const updateIntake = useTripStore((state) => state.updateIntake);
  const intake = useTripStore((state) => state.intake);
  const tripId = useTripStore((state) => state.tripId);
  const coordinatorSummary = useTripStore((state) => state.coordinatorSummary);
  const agentResult = useTripStore((state) => state.agentResult);

  const [filterRegion, setFilterRegion] = useState('all'); // 'all', 'india', 'international'

  // Pre-fill destination and navigate to /plan while preserving all existing intake values
  const handleSelectDestination = (destName) => {
    updateIntake({ destination: destName });
    navigate(`/plan?dest=${encodeURIComponent(destName)}`);
  };

  // Safely parse agentResult fields if active trip research exists
  const parsedAgent = (() => {
    if (!agentResult) return null;
    let res = agentResult;
    if (typeof res === 'string') {
      try { res = JSON.parse(res); } catch (e) { }
    }
    if (res?.output && typeof res.output === 'object') {
      res = res.output;
    }
    return res;
  })();

  const filteredDestinations = EXPLORE_DESTINATIONS.filter((dest) => {
    if (filterRegion === 'india') return dest.region === 'india';
    if (filterRegion === 'international') return dest.region === 'international';
    return true;
  });

  const destinationTitle = parsedAgent?.destination_name || parsedAgent?.destination || intake.destination || "Trip Research";
  const originTitle = intake.start_city || "Origin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 
        ==================================================
        CASE 1: ACTIVE TRIP RESEARCH RESULTS (From n8n AI Agent)
        ==================================================
      */}
      {parsedAgent ? (
        <>
          {/* Top Header Banner for Active Research */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>WanderMind AI Agent Research</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {destinationTitle} • Trip Intelligence
                </h1>
                <p className="text-xs text-slate-400">
                  {originTitle} → {destinationTitle} • {intake.travelers_count || 2} Travelers • Budget: ₹{Number(intake.total_budget || 12000).toLocaleString()} • {intake.duration_days || 4} Days
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to="/plan"
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold glass-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-primary-500 transition-colors shrink-0"
                >
                  <span>Modify Trip Request</span>
                </Link>

                <button
                  onClick={() => navigate(`/itinerary/${tripId}?dest=${encodeURIComponent(intake.destination || 'destination')}`)}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition-all hover:scale-105 shrink-0"
                >
                  <span>View Itinerary Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {coordinatorSummary && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <strong>Coordinator Summary:</strong> {coordinatorSummary}
              </p>
            )}
          </div>

          {/* n8n AI Agent Assessment & Suitability Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-teal-500/30 bg-teal-500/5 space-y-6 shadow-xl"
          >
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  AI Agent Suitability & Viability Assessment
                </h2>
                <p className="text-xs text-slate-400">
                  Synthesized by WanderMind AI Agent through Google Flights & Google Hotels
                </p>
              </div>
            </div>

            {/* 3 Suitability Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall Suitability */}
              <div className="p-5 rounded-2xl glass-card border border-slate-700/80 bg-slate-900/60 space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Trip Suitability</span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      {parsedAgent.overall_suitability || "High Match"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {parsedAgent.overall_assessment || parsedAgent.ai_reasoning || parsedAgent.reasoning || "Your travel plans, budget, and preferences come together for a smooth and enjoyable trip."}
                  </p>
                </div>
              </div>

              {/* Flight Suitability */}
              <div className="p-5 rounded-2xl glass-card border border-slate-700/80 bg-slate-900/60 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-primary-400" />
                      Flight Suitability
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {parsedAgent.flight_suitability || "Optimal Routes"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {parsedAgent.flight_assessment || "Convenient flight options that fit your travel dates, route, and trip preferences."}
                  </p>
                </div>

                <a
                  href="https://www.airindia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>Visit Air India</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Hotel Suitability */}
              <div className="p-5 rounded-2xl glass-card border border-slate-700/80 bg-slate-900/60 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Hotel className="w-3.5 h-3.5 text-amber-400" />
                      Hotel Suitability
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {parsedAgent.hotel_suitability || "Verified Stays"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {parsedAgent.hotel_suitability_assessment || parsedAgent.hotel_assessment || "stay options that balance comfort, location, budget, and what you need for the trip."}
                  </p>
                </div>

                <a
                  href="https://www.trivago.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>Visit Trivago</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* 📸 Destination in Real Life Gallery Section */}
          <DestinationRealLifeGallery destination={destinationTitle} />
        </>
      ) : null}

      {/* 
        ==================================================
        DESTINATION DISCOVERY SECTION (EXPLORE DESTINATIONS)
        ==================================================
      */}
      <div className="space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold uppercase tracking-wider text-orange-400">
              <Plane className="w-3.5 h-3.5" />
              <span>Explore Destinations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Explore Your Next Destination
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
              Discover unforgettable places across India and beyond. Pick a destination and let WanderMind plan the journey for you.
            </p>
          </div>

          {/* Filter Chips: [ All Destinations ] [ 🇮🇳 India ] [ 🌎 International ] */}
          <div className="flex items-center space-x-2 glass-panel p-1.5 rounded-2xl border border-slate-800 bg-slate-900/70 self-start md:self-auto">
            <button
              onClick={() => setFilterRegion('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filterRegion === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              All Destinations
            </button>
            <button
              onClick={() => setFilterRegion('india')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${filterRegion === 'india'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>🇮🇳</span>
              <span>India</span>
            </button>
            <button
              onClick={() => setFilterRegion('international')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${filterRegion === 'international'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>🌎</span>
              <span>International</span>
            </button>
          </div>
        </div>

        {/* 12 Destination Cards Grid (4 desktop, 2 tablet, 1 mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleSelectDestination(dest.name)}
              className="group relative rounded-3xl overflow-hidden glass-card border border-slate-800 hover:border-orange-500/50 bg-[#0c1222] flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10"
            >
              {/* Destination Image Container */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                <img
                  src={dest.image}
                  alt={dest.name}
                  loading="lazy"
                  onError={(e) => {
                    if (e.target.src !== dest.fallback) {
                      e.target.src = dest.fallback;
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />

                {/* Dark Gradient Overlay for optimal contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-[#0c1222]/30 to-transparent" />

                {/* Flight Indicator Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-md">
                    <span>✈ Flight Journey</span>
                  </span>
                </div>

                {/* India / International Tag Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full backdrop-blur-md text-[10px] font-extrabold border bg-gradient-to-r ${dest.tagColor}`}>
                    {dest.tag}
                  </span>
                </div>

                {/* Destination Name on Image Bottom */}
                <div className="absolute bottom-3 left-4 right-4 z-10">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                      {dest.name}
                    </h3>
                    <span className="text-xs text-orange-300 font-semibold drop-shadow-sm">
                      {dest.country}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {dest.description}
                </p>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDestination(dest.name);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500/80 to-amber-500/80 hover:from-orange-500 hover:to-amber-500 border border-orange-500/30 flex items-center justify-center space-x-2 transition-all group-hover:shadow-lg group-hover:shadow-orange-500/20"
                >
                  <span>Plan This Trip</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Compact CTA underneath the destination grid */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-orange-500/10 via-slate-900/70 to-teal-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Have somewhere else in mind?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Tell WanderMind what you're looking for and let the AI Agent research the best options.
            </p>
          </div>

          <Link
            to="/plan"
            className="px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/20 transition-all hover:scale-105 flex items-center space-x-2 shrink-0"
          >
            <span>Plan a Custom Trip →</span>
          </Link>
        </div>
      </div>

      {/* Telemetry Panel */}
      <AgentActivityPanel currentAgent="WanderMind n8n Orchestrator" />
    </div>
  );
};
