import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIChatbot } from './components/AIChatbot';

import { Landing } from './pages/Landing';
import { IntakeWizard } from './pages/IntakeWizard';
import { Destinations } from './pages/Destinations';
import { Itinerary } from './pages/Itinerary';
import { Booking } from './pages/Booking';
import { Receipt } from './pages/Receipt';
import { LiveTrip } from './pages/LiveTrip';
import { Evaluation } from './pages/Evaluation';
import { Login } from './pages/Login';
import { MyTrips } from './pages/MyTrips';
import { Profile } from './pages/Profile';
import { Maps } from './pages/Maps';

import { useTripStore } from './store/tripStore';
import { useAgentStream } from './hooks/useAgentStream';
import { supabase } from './lib/supabaseClient';

function App() {
  const tripId = useTripStore((state) => state.tripId);
  const setUser = useTripStore((state) => state.setUser);
  const fetchUserTrips = useTripStore((state) => state.fetchUserTrips);
  const location = useLocation();

  // Initialize SSE agent stream listener
  useAgentStream(tripId);

  // Initialize Supabase Auth Session & Listener
  useEffect(() => {
    const syncSession = async (authUser) => {
      if (!authUser) {
        setUser(null);
        return;
      }

      let profileName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Explorer';
      let avatarUrl = authUser.user_metadata?.avatar_url || null;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile?.full_name) {
          profileName = profile.full_name;
        }
        if (profile?.avatar_url) {
          avatarUrl = profile.avatar_url;
        }
      } catch (e) {
        // Profile table query fallback
      }

      const userObj = {
        id: authUser.id,
        name: profileName,
        email: authUser.email,
        avatarUrl: avatarUrl,
        joinedAt: authUser.created_at
      };

      setUser(userObj);
      fetchUserTrips(authUser.id);
    };

    // 1. Initial Session Check
    supabase.auth.getSession().then((res) => {
      if (res?.data?.session?.user) {
        syncSession(res.data.session.user);
      }
    }).catch((err) => {
      console.warn("Supabase session check notice:", err?.message || err);
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncSession(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Top Glass Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/plan" element={<IntakeWizard />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/maps" element={<Maps />} />
            <Route path="/itinerary/:id" element={<Itinerary />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/receipt/:id" element={<Receipt />} />
            <Route path="/live/:id" element={<LiveTrip />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-trips" element={<MyTrips />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating AI Trip Assistant Chatbot */}
      <AIChatbot />

      {/* Hot Toast Notification Hub */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-panel text-xs font-semibold shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white',
          duration: 3500,
          style: {
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
          }
        }}
      />
    </div>
  );
}

export default App;
