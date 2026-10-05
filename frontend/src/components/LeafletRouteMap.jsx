import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset issue
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically recenter map when coordinates change
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

export const LeafletRouteMap = ({ activities = [], defaultCenter = [15.2993, 74.1240] }) => {
  // Extract valid points
  const points = activities
    .filter((a) => a.coordinates && a.coordinates.lat && a.coordinates.lng)
    .map((a) => [a.coordinates.lat, a.coordinates.lng]);

  const center = points.length > 0 ? points[0] : defaultCenter;

  return (
    <div className="w-full h-72 rounded-2xl overflow-hidden glass-panel border border-slate-200/80 dark:border-slate-800 shadow-md">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={center} />

        {/* Draw Route Polyline */}
        {points.length > 1 && (
          <Polyline
            positions={points}
            pathOptions={{ color: '#f97316', weight: 4, dashArray: '6, 8', opacity: 0.8 }}
          />
        )}

        {/* Markers */}
        {activities.map((act, idx) => {
          if (!act.coordinates || !act.coordinates.lat) return null;
          return (
            <Marker
              key={act.id || idx}
              position={[act.coordinates.lat, act.coordinates.lng]}
              icon={customIcon}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900">{act.title}</p>
                  <p className="text-slate-600 font-mono text-[10px]">{act.time}</p>
                  <p className="text-primary-600 font-medium">{act.location_name}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
