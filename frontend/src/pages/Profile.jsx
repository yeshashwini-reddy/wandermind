import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, MapPin, LogOut, Sparkles, ShieldCheck } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const Profile = () => {
  const user = useTripStore((state) => state.user);
  const logout = useTripStore((state) => state.logout);
  const savedTrips = useTripStore((state) => state.savedTrips);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("SignOut notice:", e);
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#070b14] text-slate-100 px-4 py-12 relative overflow-hidden flex items-center justify-center">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10 space-y-6"
      >
        {/* Profile Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-[#0b1222]/90 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-800">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-orange-500/25 shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {user?.name || 'Explorer'}
              </h1>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start space-x-1 mb-3">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email || 'user@wandermind.ai'}</span>
              </p>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified WanderMind Explorer</span>
              </div>
            </div>
          </div>

          {/* Quick Stats & Navigation */}
          <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-800">
            <Link
              to="/my-trips"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Saved Trips</span>
                <MapPin className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-2xl font-extrabold text-white">
                {savedTrips.length}
              </span>
            </Link>

            <Link
              to="/plan"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Plan Trip</span>
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs font-bold text-orange-400 group-hover:underline">
                Create Itinerary →
              </span>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/my-trips"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-md shadow-orange-500/20 text-center transition-all"
            >
              View My Trips
            </Link>

            <button
              onClick={handleLogout}
              className="py-3 px-5 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
