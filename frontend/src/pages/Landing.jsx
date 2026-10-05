import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Plane, Hotel, Image as ImageIcon,
  Video as VideoIcon, Compass, Brain, CheckCircle2, ChevronRight,
  MapPin, SlidersHorizontal, ShieldCheck, Globe, Calendar, Users, DollarSign
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';

// The New 7 Wonders of the World for Cinematic Hero Slideshow
const SEVEN_WONDERS = [
  {
    id: "taj-mahal",
    name: "Taj Mahal",
    location: "Agra, India",
    image: "/images/wonders/taj-mahal.webp",
    fallback: "/images/wonders/taj_mahal.jpg",
    brightness: "bright",
    overlayFrom: "rgba(5, 10, 25, 0.68)",
    overlayTo: "rgba(5, 10, 25, 0.76)",
    vignetteOpacity: 0.68
  },
  {
    id: "great-wall",
    name: "Great Wall of China",
    location: "China",
    image: "/images/wonders/great-wall.webp",
    fallback: "/images/wonders/great_wall.jpg",
    brightness: "medium",
    overlayFrom: "rgba(5, 10, 25, 0.54)",
    overlayTo: "rgba(5, 10, 25, 0.64)",
    vignetteOpacity: 0.55
  },
  {
    id: "petra",
    name: "Petra",
    location: "Jordan",
    image: "/images/wonders/petra.webp",
    fallback: "/images/wonders/petra.jpg",
    brightness: "dark",
    overlayFrom: "rgba(5, 10, 25, 0.42)",
    overlayTo: "rgba(5, 10, 25, 0.52)",
    vignetteOpacity: 0.45
  },
  {
    id: "machu-picchu",
    name: "Machu Picchu",
    location: "Peru",
    image: "/images/wonders/machu-picchu.webp",
    fallback: "/images/wonders/machu_picchu.jpg",
    brightness: "medium",
    overlayFrom: "rgba(5, 10, 25, 0.54)",
    overlayTo: "rgba(5, 10, 25, 0.64)",
    vignetteOpacity: 0.55
  },
  {
    id: "christ-redeemer",
    name: "Christ the Redeemer",
    location: "Rio de Janeiro, Brazil",
    image: "/images/wonders/christ-redeemer.webp",
    fallback: "/images/wonders/christ_redeemer.jpg",
    brightness: "medium",
    overlayFrom: "rgba(5, 10, 25, 0.54)",
    overlayTo: "rgba(5, 10, 25, 0.64)",
    vignetteOpacity: 0.55
  },
  {
    id: "colosseum",
    name: "Colosseum",
    location: "Rome, Italy",
    image: "/images/wonders/colosseum.webp",
    fallback: "/images/wonders/colosseum.jpg",
    brightness: "dark",
    overlayFrom: "rgba(5, 10, 25, 0.45)",
    overlayTo: "rgba(5, 10, 25, 0.55)",
    vignetteOpacity: 0.48
  },
  {
    id: "chichen-itza",
    name: "Chichén Itzá",
    location: "Yucatán, Mexico",
    image: "/images/wonders/chichen-itza.webp",
    fallback: "/images/wonders/chichen_itza.jpg",
    brightness: "bright",
    overlayFrom: "rgba(5, 10, 25, 0.68)",
    overlayTo: "rgba(5, 10, 25, 0.76)",
    vignetteOpacity: 0.68
  }
];

// Curated 12 Indian & International Destinations
const DESTINATIONS_DATA = [
  // India Destinations (1-6)
  {
    id: 'delhi',
    name: 'Delhi',
    country: 'India',
    region: 'india',
    tag: 'Heritage & Gastronomy',
    tagColor: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    flightLabel: '✈ Flight Journey',
    description: 'Historic monuments, lively bustling bazaars, and legendary culinary culture.',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/wonders/taj_mahal.jpg'
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    region: 'india',
    tag: 'Sun, Sand & Heritage',
    tagColor: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/30',
    flightLabel: '✈ Fly with WanderMind',
    description: 'Sun-drenched golden beaches, Portuguese architecture, and coastal relaxation.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/goa.jpg'
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    region: 'india',
    tag: 'Royal Forts & Palaces',
    tagColor: 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30',
    flightLabel: '✈ Flight Journey',
    description: 'The regal Pink City with majestic hill forts, ornate palaces, and rich craft traditions.',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/jaipur.jpg'
  },
  {
    id: 'kerala',
    name: 'Kerala',
    country: 'India',
    region: 'india',
    tag: 'Backwaters & Lush Hills',
    tagColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
    flightLabel: '✈ Fly with WanderMind',
    description: 'Serene palm-fringed backwaters, misty spice hills, and rejuvenating coastal calm.',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/kerala.jpg'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    region: 'india',
    tag: 'Coastal Metropolis',
    tagColor: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30',
    flightLabel: '✈ Flight Journey',
    description: 'Dynamic Arabian Sea promenade, colonial architecture, and electrifying city life.',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/goa.jpg'
  },
  {
    id: 'kashmir',
    name: 'Kashmir',
    country: 'India',
    region: 'india',
    tag: 'Himalayan Paradise',
    tagColor: 'from-sky-500/20 to-cyan-500/20 text-sky-300 border-sky-500/30',
    flightLabel: '✈ Fly with WanderMind',
    description: 'Breathtaking snow peaks, serene shikara rides on Dal Lake, and alpine meadows.',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/manali.jpg'
  },

  // International Destinations (7-12)
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    region: 'international',
    tag: 'Futuristic Wonders',
    tagColor: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30',
    flightLabel: '✈ Flight Journey',
    description: 'Iconic skyscrapers, luxury shopping, desert safaris, and cutting-edge attractions.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/wonders/petra.jpg'
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    region: 'international',
    tag: 'Garden Metropolis',
    tagColor: 'from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30',
    flightLabel: '✈ Fly with WanderMind',
    description: 'Supertree groves, Marina Bay waterfront, and Michelin-rated global gastronomy.',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/coorg.jpg'
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    region: 'international',
    tag: 'Temples & Street Life',
    tagColor: 'from-orange-500/20 to-rose-500/20 text-orange-300 border-orange-500/30',
    flightLabel: '✈ Flight Journey',
    description: 'Gilded Chao Phraya temples, lively canal markets, and world-famous street food.',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/varanasi.jpg'
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'international',
    tag: 'Tropical Sanctuary',
    tagColor: 'from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30',
    flightLabel: '✈ Fly with WanderMind',
    description: 'Terraced emerald rice fields, cliffside ocean temples, and tranquil island wellness.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/munnar.jpg'
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'international',
    tag: 'Art, Romance & Architecture',
    tagColor: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
    flightLabel: '✈ Flight Journey',
    description: 'Timeless Seine riverbanks, iconic architectural landmarks, and world-class museums.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/wonders/colosseum.jpg'
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Maldives',
    region: 'international',
    tag: 'Crystal Lagoon & Atolls',
    tagColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
    flightLabel: '✈ Fly with WanderMind',
    description: 'Pristine turquoise lagoons, overwater villas, and vibrant tropical coral reefs.',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
    fallback: '/images/andaman.jpg'
  }
];

// Workflow Steps Data
const WORKFLOW_STEPS = [
  {
    step: '01',
    name: 'You Plan',
    icon: Compass,
    color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Enter your starting location and travel preferences:',
    items: ['Origin & Destination', 'Travel date & duration', 'Number of travelers', 'Budget & priorities']
  },
  {
    step: '02',
    name: 'WanderMind AI Agent',
    icon: Brain,
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'The AI Agent understands your specific request:',
    items: ['Validates constraints', 'Determines search queries', 'Plans live tool execution', 'Coordinates research flow']
  },
  {
    step: '03',
    name: 'Real-Time Research',
    icon: Globe,
    color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-400',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Agent uses external tools via SerpApi:',
    items: ['✈ Google Flights via SerpApi', '🏨 Google Hotels via SerpApi', '🖼 Google Images via SerpApi', '🎥 Google Videos via SerpApi']
  },
  {
    step: '04',
    name: 'AI Reasoning',
    icon: SlidersHorizontal,
    color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-400',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Gemini evaluates multi-dimensional fit:',
    items: ['Flight suitability', 'Hotel suitability', 'Budget fit & duration', 'User priority & trip viability']
  },
  {
    step: '05',
    name: 'Smart Recommendation',
    icon: CheckCircle2,
    color: 'from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-400',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Structured output ready for action:',
    items: ['Suitability assessments', 'Verified stay & flight options', 'Curated visuals & media', 'Day-by-day dynamic plan']
  }
];

export const Landing = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const updateIntake = useTripStore((state) => state.updateIntake);
  const [currentWonderIndex, setCurrentWonderIndex] = useState(0);
  const [destinationFilter, setDestinationFilter] = useState('all'); // 'all', 'india', 'international'

  // Preload all 7 wonder images on mount to guarantee instant zero-flicker rendering
  useEffect(() => {
    SEVEN_WONDERS.forEach((wonder) => {
      const imgWebp = new Image();
      imgWebp.src = wonder.image;
      const imgJpg = new Image();
      imgJpg.src = wonder.fallback;
    });
  }, []);

  // 2-Second Cinematic Loop across the 7 Wonders of the World
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWonderIndex((prev) => (prev + 1) % SEVEN_WONDERS.length);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const activeWonder = SEVEN_WONDERS[currentWonderIndex];

  // Handler for destination card click
  const handlePlanDestination = (destinationName) => {
    updateIntake({ destination: destinationName });
    navigate(`/plan?dest=${encodeURIComponent(destinationName)}`);
  };

  const filteredDestinations = DESTINATIONS_DATA.filter((dest) => {
    if (destinationFilter === 'india') return dest.region === 'india';
    if (destinationFilter === 'international') return dest.region === 'international';
    return true;
  });

  return (
    <div className="space-y-24 py-0 pb-16">
      {/* 
        ==================================================
        1. HERO SECTION WITH 7 WONDERS CINEMATIC SLIDESHOW
        ==================================================
      */}
      <section className="relative overflow-hidden min-h-[580px] sm:min-h-[640px] flex items-center justify-center pt-16 pb-20 sm:pt-20 sm:pb-24">
        {/* Layer 1: Background Images (z-0, Cover, Center, 800ms smooth crossfade) */}
        <div className="hero-background absolute inset-0 z-0 overflow-hidden bg-[#070b14]">
          {SEVEN_WONDERS.map((wonder, index) => {
            const isActive = index === currentWonderIndex;
            return (
              <div
                key={wonder.id}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url('${wonder.image}'), url('${wonder.fallback}')`,
                  opacity: isActive ? 1 : 0,
                  transform: shouldReduceMotion
                    ? 'scale(1)'
                    : isActive
                    ? 'scale(1.03)'
                    : 'scale(1)',
                  transition: 'opacity 800ms ease-in-out, transform 2400ms ease-out',
                  willChange: 'opacity, transform'
                }}
              />
            );
          })}
        </div>

        {/* Layer 2: Dynamic Smart Dark Overlay (z-[1], pointer-events-none) */}
        <div
          className="hero-overlay absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${activeWonder.overlayFrom}, ${activeWonder.overlayTo})`,
            transition: 'background 800ms ease-in-out'
          }}
        />

        {/* Layer 3: Subtle Adaptive Vignette (z-[2]) */}
        <div
          className="hero-vignette absolute inset-0 z-[2] pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(5,10,25,0.3)_55%,_rgba(5,10,25,0.85)_100%)]"
          style={{
            opacity: activeWonder.vignetteOpacity,
            transition: 'opacity 800ms ease-in-out'
          }}
        />

        {/* Layer 4: Hero Content (z-10) */}
        <div className="hero-content relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#070b14]/80 border border-amber-400/40 text-xs font-bold text-amber-400 shadow-xl backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI Travel Planner & Real-Time Research Engine</span>
          </motion.div>

          {/* Hero Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15]"
          >
            <span
              className="text-white block"
              style={{ textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}
            >
              Travel Plans Break.
            </span>
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFB347] via-[#FF8C66] to-[#FF6B6B] inline-block mt-1"
              style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.4))' }}
            >
              WanderMind Replans in Real Time.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-[#E2E8F0] max-w-3xl mx-auto leading-relaxed font-medium"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}
          >
            From your travel preferences to an intelligent trip decision — WanderMind leverages Gemini AI reasoning and live Google Flights & Hotels research via SerpApi to deliver structured, verified travel intelligence.
          </motion.p>

          {/* Single Centered Primary CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center pt-2"
          >
            <Link
              to="/plan"
              className="px-8 sm:px-10 py-4 rounded-2xl text-base sm:text-lg font-extrabold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105 flex items-center justify-center space-x-2.5"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Plan My Trip with AI</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 
        ==================================================
        2. HOW WANDERMIND WORKS (Visual Workflow Pipeline)
        ==================================================
      */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold uppercase tracking-wider text-teal-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Architecture & Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How WanderMind Works
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            From your travel preferences to an intelligent trip decision — WanderMind researches, reasons, and recommends.
          </p>
        </div>

        {/* Visual Workflow Steps (Horizontal Flow) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
          {WORKFLOW_STEPS.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-5 rounded-3xl glass-card border bg-gradient-to-b ${item.color} flex flex-col justify-between hover:-translate-y-1.5 transition-all shadow-xl group`}
              >
                {/* Step Number Badge & Icon */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                      STEP {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    {item.name}
                  </h3>

                  <p className="text-[11px] text-slate-300 font-medium">
                    {item.description}
                  </p>

                  {/* Bullet Points */}
                  <ul className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                    {item.items.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start space-x-1.5">
                        <span className="text-orange-400 font-bold shrink-0">•</span>
                        <span className="leading-tight">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pipeline Arrow (visible on desktop between items) */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center shadow-lg">
                      <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pipeline Summary Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-bold text-slate-300">
          <span className="text-orange-400">USER INPUT</span>
          <span className="text-slate-600">→</span>
          <span className="text-purple-400">WANDERMIND AI AGENT</span>
          <span className="text-slate-600">→</span>
          <span className="text-teal-400">REAL-TIME TRAVEL RESEARCH</span>
          <span className="text-slate-600">→</span>
          <span className="text-sky-400">AI REASONING</span>
          <span className="text-slate-600">→</span>
          <span className="text-rose-400">TRAVEL RECOMMENDATION</span>
        </div>
      </section>

      {/* 
        ==================================================
        3. EXPLORE DESTINATIONS SECTION
        ==================================================
      */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold uppercase tracking-wider text-orange-400">
              <Plane className="w-3.5 h-3.5" />
              <span>Explore Destinations</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Places Worth Flying To
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
              Discover places worth flying to — from iconic Indian escapes to unforgettable international journeys.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center space-x-2 glass-panel p-1.5 rounded-2xl border border-slate-800 bg-slate-900/70 self-start md:self-auto">
            <button
              onClick={() => setDestinationFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                destinationFilter === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All (12)
            </button>
            <button
              onClick={() => setDestinationFilter('india')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                destinationFilter === 'india'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              India (6)
            </button>
            <button
              onClick={() => setDestinationFilter('international')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                destinationFilter === 'international'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              International (6)
            </button>
          </div>
        </div>

        {/* Destination Cards Grid (3-4 col desktop, 2 col tablet, 1 col mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handlePlanDestination(dest.name)}
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

                {/* Flight Journey Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-md">
                    <span>{dest.flightLabel}</span>
                  </span>
                </div>

                {/* Tag pill */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full backdrop-blur-md text-[10px] font-extrabold border bg-gradient-to-r ${dest.tagColor}`}>
                    {dest.tag}
                  </span>
                </div>

                {/* Destination Name on Image Bottom */}
                <div className="absolute bottom-3 left-4 right-4 z-10">
                  <div className="flex items-baseline justify-between">
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
                    handlePlanDestination(dest.name);
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
      </section>

      {/* 
        ==================================================
        4. CTA / PLAN YOUR TRIP SECTION
        ==================================================
      */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-slate-900/90 to-teal-500/10 text-center space-y-6 shadow-2xl">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-xs font-extrabold uppercase tracking-wider text-orange-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Your Journey</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to plan your next journey?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Tell WanderMind where you want to go, what matters to you, and how much you want to spend.
            </p>
          </div>

          <div className="relative z-10 pt-2 flex items-center justify-center">
            <Link
              to="/plan"
              className="px-8 sm:px-10 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105 flex items-center space-x-2"
            >
              <span>Plan My Trip →</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
