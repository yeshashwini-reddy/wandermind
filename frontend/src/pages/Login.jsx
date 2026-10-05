import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Mail, Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTripStore } from '../store/tripStore';
import { supabase } from '../lib/supabaseClient';

export const Login = () => {
  const setUser = useTripStore((state) => state.setUser);
  const fetchUserTrips = useTripStore((state) => state.fetchUserTrips);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name || 'Explorer'
            }
          }
        });

        if (error) {
          throw error;
        }

        const authUser = data.user;
        if (authUser) {
          // Insert profile into public.profiles
          try {
            await supabase.from('profiles').upsert([
              {
                id: authUser.id,
                full_name: formData.name || 'Explorer',
                email: authUser.email,
                avatar_url: null
              }
            ]);
          } catch (pe) {
            console.error("Profile creation warning:", pe);
          }

          const userObj = {
            id: authUser.id,
            name: formData.name || authUser.email?.split('@')[0] || 'Explorer',
            email: authUser.email,
            joinedAt: authUser.created_at || new Date().toISOString()
          };

          setUser(userObj);
          fetchUserTrips(authUser.id);
          toast.success(`Welcome to WanderMind, ${userObj.name}! Account created.`);
          navigate('/');
        }
      } else {
        // Sign In Flow with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          throw error;
        }

        const authUser = data.user;
        if (authUser) {
          let fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Explorer';

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', authUser.id)
              .single();

            if (profile?.full_name) {
              fullName = profile.full_name;
            }
          } catch (pe) {
            // Profile fallback
          }

          const userObj = {
            id: authUser.id,
            name: fullName,
            email: authUser.email,
            joinedAt: authUser.created_at || new Date().toISOString()
          };

          setUser(userObj);
          fetchUserTrips(authUser.id);
          toast.success(`Welcome back, ${userObj.name}!`);
          navigate('/');
        }
      }
    } catch (err) {
      console.error("Authentication error:", err);
      toast.error(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#070b14]">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card Header & Brand Icon */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2.5 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500">
              WanderMind
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-xs text-slate-400">
            {isSignUp
              ? 'Join WanderMind to unlock AI-powered travel itineraries'
              : 'Sign in to access your saved trips and personalized plans'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl bg-[#0b1222]/90 backdrop-blur-xl">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isSignUp
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isSignUp
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required={isSignUp}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/70 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/70 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => toast.info('Password reset feature coming soon!')}
                    className="text-[11px] text-orange-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/70 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 mt-6 disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Protected by WanderMind AI Mesh Security
        </p>
      </motion.div>
    </div>
  );
};
