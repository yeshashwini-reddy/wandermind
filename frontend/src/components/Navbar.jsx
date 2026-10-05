import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, MapPin, Map, Menu, X, User } from 'lucide-react';
import { useTripStore } from '../store/tripStore';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useTripStore((state) => state.user);

  const navLinks = [
    { path: '/', label: 'Home', icon: Compass },
    { path: '/plan', label: 'Plan', icon: Sparkles },
    { path: '/destinations', label: 'Destinations', icon: MapPin },
    { path: '/maps', label: 'Maps', icon: Map },
  ];

  return (
    <header className="sticky top-0 z-50 glass-nav h-[72px] flex items-center shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform duration-200">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500">
              WanderMind
            </span>
            <span className="text-[9px] font-bold text-teal-400 tracking-wider uppercase -mt-1">
              AI Travel Planner
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 h-9 ${
                  isActive
                    ? 'text-orange-400'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-orange-500/20 rounded-xl border border-orange-500/30"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 shrink-0 z-10 ${isActive ? 'text-orange-400' : 'text-slate-300'}`} />
                <span className="z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Login / Sign Up & Plan Trip CTA & Mobile Toggle */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to={user ? "/profile" : "/login"}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap shrink-0 ${
              location.pathname === '/login' || location.pathname === '/profile'
                ? 'text-orange-400 bg-orange-500/20 border border-orange-500/30'
                : 'text-slate-200 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-slate-300" />
            <span>{user ? (user.name || "Profile") : "Login / Sign Up"}</span>
          </Link>

          <Link
            to="/plan"
            className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 transition-all hover:scale-105 flex items-center justify-center space-x-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Plan Trip</span>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-200 hover:bg-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Panel (<768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-[72px] left-0 right-0 glass-panel border-b border-slate-800 px-4 py-4 space-y-2 shadow-2xl overflow-hidden bg-[#090e1c]/98"
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold ${
                      isActive
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-300" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to={user ? "/profile" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold ${
                  location.pathname === '/login' || location.pathname === '/profile'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-slate-300" />
                <span>{user ? (user.name || "Profile") : "Login / Sign Up"}</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-800/80 px-4 py-2 flex items-center justify-around bg-[#090e1c]/95 backdrop-blur-xl">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-orange-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          to={user ? "/profile" : "/login"}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
            location.pathname === '/login' || location.pathname === '/profile'
              ? 'text-orange-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span>{user ? 'Profile' : 'Login'}</span>
        </Link>
        <Link
          to="/plan"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold text-orange-400"
        >
          <Sparkles className="w-4 h-4 mb-0.5 animate-pulse" />
          <span>Plan Trip</span>
        </Link>
      </div>
    </header>
  );
};
