import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, ArrowRight, ArrowLeftRight, Clock, Plane,
  Compass, Sparkles, AlertCircle, Loader2, Map as MapIcon,
  CheckCircle2, Milestone, ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapsRouteApi } from '../api/client';

// Custom Leaflet DivIcons with pulsing glow for WanderMind theme
const createOriginIcon = (label) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-1.5 bg-emerald-500/40 rounded-full animate-ping"></div>
        <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const createDestinationIcon = (label) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-1.5 bg-orange-500/40 rounded-full animate-ping"></div>
        <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-rose-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

// Component to dynamically fit map bounds to the route and markers
function MapBoundsController({ routeData }) {
  const map = useMap();

  useEffect(() => {
    if (!routeData) return;

    try {
      if (routeData.route_geometry && routeData.route_geometry.length > 0) {
        const bounds = L.latLngBounds(routeData.route_geometry);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true, duration: 1.2 });
      } else if (routeData.origin && routeData.destination) {
        const bounds = L.latLngBounds([
          [routeData.origin.latitude, routeData.origin.longitude],
          [routeData.destination.latitude, routeData.destination.longitude]
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true, duration: 1.2 });
      }
    } catch (e) {
      console.warn("Map bounds fit warning:", e);
    }
  }, [routeData, map]);

  return null;
}

export const Maps = () => {
  const [origin, setOrigin] = useState('Hyderabad');
  const [destination, setDestination] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeResult, setRouteResult] = useState(null);

  // Read LocationIQ token from Vite env if available for tiles
  const locationIqKey = import.meta.env.VITE_LOCATIONIQ_API_KEY || '';

  // Tile layer URL: LocationIQ Vector/Streets raster or OSM fallback
  const tileUrl = locationIqKey
    ? `https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${locationIqKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = locationIqKey
    ? '&copy; <a href="https://locationiq.com/?ref=maps" target="_blank" rel="noopener">LocationIQ</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

  // Popular route quick chips
  const QUICK_ROUTES = [
    { from: 'Hyderabad', to: 'Delhi' },
    { from: 'Mumbai', to: 'Goa' },
    { from: 'Delhi', to: 'Jaipur' },
    { from: 'Paris', to: 'London' },
    { from: 'Tokyo', to: 'Kyoto' }
  ];

  const handleSearchRoute = async (startQuery = origin, endQuery = destination) => {
    const cleanStart = startQuery.trim();
    const cleanEnd = endQuery.trim();

    if (!cleanStart) {
      setError('Please enter a starting location.');
      return;
    }
    if (!cleanEnd) {
      setError('Please enter a destination.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getMapsRouteApi(cleanStart, cleanEnd);
      if (data && data.success) {
        setRouteResult(data);
      } else {
        setError(data?.error || "We couldn't calculate a route between these locations.");
      }
    } catch (err) {
      const apiMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
      if (apiMsg && typeof apiMsg === 'string') {
        setError(apiMsg);
      } else {
        setError("Map service is temporarily unavailable. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleQuickRoute = (item) => {
    setOrigin(item.from);
    setDestination(item.to);
    handleSearchRoute(item.from, item.to);
  };

  return (
    <div className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 
        ==================================================
        PAGE HERO HEADER
        ==================================================
      */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold uppercase tracking-wider text-orange-400">
            <MapIcon className="w-3.5 h-3.5" />
            <span>Interactive Maps & Routing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Plan Your Route
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
            Enter your starting location and destination to explore your journey on the map.
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Popular:</span>
          </span>
          {QUICK_ROUTES.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickRoute(qr)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 border border-slate-700/80 hover:border-orange-500/40 transition-all hover:scale-105 cursor-pointer"
            >
              {qr.from} → {qr.to}
            </button>
          ))}
        </div>
      </div>

      {/* 
        ==================================================
        TWO LOCATION INPUT BOXES & SHOW ON MAP BUTTON
        ==================================================
      */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto] gap-3 items-center">
          {/* Box 1: Starting Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Starting Location</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchRoute()}
                placeholder="Enter starting city (e.g. Hyderabad)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
              />
              <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-6">
            <button
              onClick={handleSwap}
              title="Swap starting point and destination"
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Box 2: Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Destination</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchRoute()}
                placeholder="Enter destination city (e.g. Delhi)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
              />
              <MapPin className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Primary Action Button: Show on Map */}
          <div className="md:pt-6">
            <button
              onClick={() => handleSearchRoute()}
              disabled={loading}
              className="w-full md:w-auto h-12 px-7 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finding route...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Show on Map</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2.5 text-rose-300 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 
        ==================================================
        LEAFLET + REACT-LEAFLET INTERACTIVE MAP CONTAINER
        ==================================================
      */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        {/* Top Overlay Banner if no route calculated yet */}
        {!routeResult && !loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center space-x-2 text-xs font-semibold text-slate-300 pointer-events-none">
            <Compass className="w-4 h-4 text-orange-400 animate-spin-slow" />
            <span>Enter your starting location and destination to view your route.</span>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-[500] bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-xl">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="text-sm font-bold text-white tracking-wide">
              Calculating Route via LocationIQ...
            </div>
            <div className="text-xs text-slate-400">
              Fetching geocoding coordinates and road directions
            </div>
          </div>
        )}

        {/* Leaflet Map */}
        <div className="w-full h-[420px] sm:h-[550px]">
          <MapContainer
            center={
              routeResult?.origin
                ? [routeResult.origin.latitude, routeResult.origin.longitude]
                : [20.5937, 78.9629] // Default India center
            }
            zoom={5}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            style={{ background: '#0a0f1d' }}
          >
            <TileLayer
              attribution={tileAttribution}
              url={tileUrl}
              maxZoom={18}
            />

            {/* Dynamic Bounds Controller */}
            <MapBoundsController routeData={routeResult} />

            {/* Starting Location Marker */}
            {routeResult?.origin && (
              <Marker
                position={[routeResult.origin.latitude, routeResult.origin.longitude]}
                icon={createOriginIcon(routeResult.origin.name)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      Origin
                    </div>
                    <div className="text-xs font-black text-slate-900">
                      {routeResult.origin.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {routeResult.origin.full_name}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination Location Marker */}
            {routeResult?.destination && (
              <Marker
                position={[routeResult.destination.latitude, routeResult.destination.longitude]}
                icon={createDestinationIcon(routeResult.destination.name)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1">
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      Destination
                    </div>
                    <div className="text-xs font-black text-slate-900">
                      {routeResult.destination.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {routeResult.destination.full_name}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Driving Route Polyline */}
            {routeResult?.route_geometry && routeResult.route_geometry.length > 0 && (
              <>
                {/* Glow Background Polyline */}
                <Polyline
                  positions={routeResult.route_geometry}
                  pathOptions={{
                    color: '#f97316',
                    weight: 8,
                    opacity: 0.35,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
                {/* Sharp Foreground Polyline */}
                <Polyline
                  positions={routeResult.route_geometry}
                  pathOptions={{
                    color: '#fbbf24',
                    weight: 4,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* 
        ==================================================
        ROUTE INFORMATION PANEL ("YOUR JOURNEY")
        ==================================================
      */}
      <AnimatePresence>
        {routeResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Milestone className="w-4 h-4" />
                  <span>Your Journey</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white flex items-center space-x-2.5 flex-wrap">
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <MapPin className="w-4 h-4 inline" />
                    <span>{routeResult.origin.name}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span className="text-rose-400 flex items-center space-x-1">
                    <MapPin className="w-4 h-4 inline" />
                    <span>{routeResult.destination.name}</span>
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 self-start sm:self-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Route Verified</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Distance */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Total Distance</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {routeResult.distance_formatted}
                </div>
                <div className="text-[10px] text-slate-400">
                  {routeResult.distance_km} kilometers calculated
                </div>
              </div>

              {/* Metric 2: Estimated Flight Time */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Plane className="w-3.5 h-3.5 text-orange-400" />
                  <span>Estimated Flight Time</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {routeResult.flight_duration_formatted || "Flight time unavailable"}
                </div>
                <div className="text-[10px] text-slate-400">
                  {routeResult.flight_duration_formatted ? "Estimated direct flight duration" : "Flight duration data not available"}
                </div>
              </div>

              {/* Metric 3: Starting Point Coords */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Start Coordinates</span>
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {routeResult.origin.latitude.toFixed(4)}° N, {routeResult.origin.longitude.toFixed(4)}° E
                </div>
                <div className="text-[10px] text-slate-400 truncate" title={routeResult.origin.full_name}>
                  {routeResult.origin.full_name}
                </div>
              </div>

              {/* Metric 4: Destination Coords */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Destination Coordinates</span>
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {routeResult.destination.latitude.toFixed(4)}° N, {routeResult.destination.longitude.toFixed(4)}° E
                </div>
                <div className="text-[10px] text-slate-400 truncate" title={routeResult.destination.full_name}>
                  {routeResult.destination.full_name}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
