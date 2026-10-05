import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass, MapPin, Calendar, Users, Sparkles,
  ArrowRight, CreditCard, Activity, CheckCircle2,
  Trash2
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import toast from 'react-hot-toast';

export const MyTrips = () => {
  const savedTrips = useTripStore((state) => state.savedTrips);
  const tripId = useTripStore((state) => state.tripId);
  const user = useTripStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#070b14] text-slate-100 px-4 py-10 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500">
              My Trips
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {user ? `Saved plans and bookings for ${user.name}` : 'Your saved and booked WanderMind travel plans'}
            </p>
          </div>

          <Link
            to="/plan"
            className="h-10 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all shrink-0 w-fit"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Plan New Trip</span>
          </Link>
        </div>

        {/* Trips List or Empty State */}
        {savedTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-6 glass-panel rounded-3xl border border-slate-800/80 bg-[#0b1222]/80 max-w-lg mx-auto shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mx-auto mb-4">
              <Compass className="w-8 h-8 animate-spin-slow" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">No trips yet</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Start planning your first trip with WanderMind.
            </p>

            <Link
              to="/plan"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan a Trip</span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.map((trip, idx) => (
              <motion.div
                key={trip.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass-panel rounded-2xl border border-slate-800 p-5 bg-[#0b1222]/90 flex flex-col justify-between space-y-4 hover:border-orange-500/40 transition-all shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        trip.status === 'Confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {trip.status || 'Planned'}
                    </span>
                    {trip.bookingId && (
                      <span className="text-[10px] font-mono text-slate-500">
                        #{trip.bookingId}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{trip.destination}</span>
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{trip.dates}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <span>{trip.travelers} Travelers</span>
                    </div>
                    {trip.amount && (
                      <div className="flex items-center space-x-2 text-slate-400">
                        <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                        <span>₹{Number(trip.amount).toLocaleString('en-IN')} Total</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/itinerary/${trip.id}`)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-[11px] font-bold text-slate-200 hover:text-white flex items-center justify-center space-x-1 transition-all"
                  >
                    <span>Itinerary</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => navigate(`/live/${trip.id}`)}
                    className="py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[11px] font-bold text-orange-400 flex items-center justify-center space-x-1 transition-all"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Live</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
