import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Share2, Calendar, QrCode,
  CheckCircle2, Sparkles, ArrowRight, MessageSquare,
  ShieldCheck, Plane, Hotel
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import toast from 'react-hot-toast';

export const Receipt = () => {
  const { id } = useParams();
  const tripId = useTripStore((state) => state.tripId);
  const intake = useTripStore((state) => state.intake);
  const selectedFlight = useTripStore((state) => state.selectedFlight);
  const selectedHotel = useTripStore((state) => state.selectedHotel);

  const bookingId = id || `WM-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleDownloadIcs = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WanderMind//AI Trip Planner//EN
BEGIN:VEVENT
SUMMARY:WanderMind Trip: ${intake?.destination || 'Confirmed Vacation'}
DESCRIPTION:Booking ID: ${bookingId}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WanderMind_${bookingId}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Calendar invite downloaded!");
  };

  const handleWhatsAppShare = () => {
    const text = `🎉 My WanderMind AI Trip is Confirmed!\nBooking ID: ${bookingId}\nDestination: ${intake?.destination || 'Vacation'}\nLive Replan Link: ${window.location.origin}/live/${tripId}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Shareable trip link copied to clipboard!");
  };

  const totalCost = (selectedFlight?.price || 0) + (selectedHotel?.price || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Official E-Receipt & Itinerary Confirmation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Booking Receipt #{bookingId}
          </h1>
          <p className="text-xs text-slate-400">Issued by WanderMind Autonomous Multi-Agent Systems</p>
        </div>
      </div>

      {/* Main Receipt Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-8 shadow-2xl relative overflow-hidden"
      >
        {/* Top Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Trip ID</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">{tripId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Travelers</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">{intake.travelers_count || 2} Persons</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">{intake.destination || "Goa, India"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
            <span className="font-mono font-bold text-emerald-500">CONFIRMED</span>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Confirmed Services Breakdown
          </h3>

          <div className="space-y-2 text-xs">
            {selectedFlight && (
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Plane className="w-4 h-4 text-primary-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {selectedFlight.title || selectedFlight.provider || "Confirmed Flight"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedFlight.origin} → {selectedFlight.destination} • {selectedFlight.duration}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                  ₹{Number(selectedFlight.price || 0).toLocaleString()}
                </span>
              </div>
            )}

            {selectedHotel && (
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Hotel className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {selectedHotel.title || "Confirmed Hotel Stay"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedHotel.duration_or_tier || "Standard Room"}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                  ₹{Number(selectedHotel.price || 0).toLocaleString()}
                </span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-teal-700 dark:text-teal-300 block">
                  ⚡ WanderMind Multi-Agent Real-Time Replan Concierge
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  24/7 autonomous weather and delay monitoring guarantee
                </span>
              </div>
              <span className="font-mono font-bold text-teal-500">INCLUDED</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">Total Estimated Package:</span>
            <span className="text-2xl font-black gradient-text font-mono">
              ₹{Number(totalCost || intake.total_budget || 30000).toLocaleString()}
            </span>
          </div>
        </div>

        {/* QR Code Verification Box */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode className="w-4 h-4 text-primary-500" />
              Digital Check-In QR Pass
            </span>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Scan this code at flight check-in or hotel reception for instant trip confirmation.
            </p>
          </div>

          <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white text-[9px] font-mono text-center p-1 font-bold">
              [WM-QR-VERIFIED]
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <button
          onClick={handleWhatsAppShare}
          className="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-500 hover:border-emerald-500 transition-all flex items-center justify-center space-x-2"
        >
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          <span>Share to WhatsApp</span>
        </button>

        <button
          onClick={handleDownloadIcs}
          className="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 hover:text-blue-500 hover:border-blue-500 transition-all flex items-center justify-center space-x-2"
        >
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Add to Calendar (.ics)</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 hover:text-primary-500 hover:border-primary-500 transition-all flex items-center justify-center space-x-2"
        >
          <Share2 className="w-4 h-4 text-primary-500" />
          <span>Copy Shareable Link</span>
        </button>
      </div>

      {/* Navigation link to Live Trip */}
      <div className="text-center pt-2">
        <Link
          to={`/live/${tripId}`}
          className="inline-flex items-center space-x-2 text-sm font-extrabold text-primary-500 hover:text-primary-600 transition-colors"
        >
          <span>Proceed to Live Trip Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
