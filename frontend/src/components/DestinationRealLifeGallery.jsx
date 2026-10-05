import React, { useState, useEffect } from 'react';
import { Camera, ExternalLink, Sparkles } from 'lucide-react';
import { getDestinationMediaApi } from '../api/client';

// Client-side cache to avoid repeated requests during session
const mediaCache = new Map();

export const DestinationRealLifeGallery = ({ destination }) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const cleanDestination = (destination || '').trim();

  useEffect(() => {
    let isMounted = true;

    if (!cleanDestination) {
      setIsLoading(false);
      return;
    }

    // Check session cache
    if (mediaCache.has(cleanDestination)) {
      const cached = mediaCache.get(cleanDestination);
      setPhotos(cached.photos);
      setHasError(cached.hasError);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    getDestinationMediaApi(cleanDestination, 6)
      .then((data) => {
        if (!isMounted) return;
        const fetchedPhotos = data?.photos || [];
        const isError = fetchedPhotos.length === 0 && Boolean(data?.error);
        mediaCache.set(cleanDestination, {
          photos: fetchedPhotos,
          hasError: isError,
        });
        setPhotos(fetchedPhotos);
        setHasError(isError);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn(`[DestinationMedia] Failed to load photos for ${cleanDestination}:`, err);
        mediaCache.set(cleanDestination, { photos: [], hasError: true });
        setPhotos([]);
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanDestination]);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 bg-slate-900/50 space-y-6 shadow-xl">
      {/* Section Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <span>📸</span>
          <span>Destination in Real Life</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-normal">
          See the places, landmarks, and experiences waiting for you in{' '}
          <strong className="text-orange-400">{cleanDestination || 'your destination'}</strong>.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:row-span-2 rounded-2xl bg-slate-800/70 border border-slate-700/40 min-h-[280px] animate-pulse flex items-center justify-center">
              <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-slate-800/70 border border-slate-700/40 aspect-video animate-pulse flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-slate-600 animate-pulse" />
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-slate-400 font-medium animate-pulse">
            Finding real photos of {cleanDestination || 'destination'}...
          </p>
        </div>
      )}

      {/* Real Photos Grid (6 photos layout) */}
      {!isLoading && photos.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, idx) => {
              const isLarge = idx === 0;
              return (
                <div
                  key={photo.id || idx}
                  className={`group relative rounded-2xl overflow-hidden glass-card border border-slate-700/60 bg-slate-900 ${
                    isLarge ? 'lg:row-span-2 min-h-[260px]' : 'aspect-video'
                  }`}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.description || `${cleanDestination} photo`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Dark Gradient Overlay with Attribution on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-between">
                    <div className="self-end">
                      <a
                        href={photo.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Photo by ${photo.photographer} on Unsplash`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-medium text-slate-200 hover:text-white transition-colors"
                      >
                        <span className="truncate max-w-[100px]">{photo.photographer}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs text-white font-bold line-clamp-1">
                        {photo.description}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Photo by{' '}
                        <a
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:underline font-medium"
                        >
                          {photo.photographer}
                        </a>{' '}
                        on{' '}
                        <a
                          href={photo.unsplashUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:underline font-medium"
                        >
                          Unsplash
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtle footer note */}
          <div className="flex items-center justify-end text-[11px] text-slate-500 pt-1">
            <span>
              Real travel photography powered by{' '}
              <a
                href="https://unsplash.com/?utm_source=wandermind&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-orange-400 transition-colors font-medium underline underline-offset-2"
              >
                Unsplash
              </a>
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && hasError && photos.length === 0 && (
        <div className="p-6 rounded-2xl glass-card border border-slate-800 text-center space-y-1 bg-slate-900/40">
          <p className="text-xs sm:text-sm text-slate-400">
            Destination photos couldn't be loaded right now.
          </p>
        </div>
      )}

      {/* Empty Results State */}
      {!isLoading && !hasError && photos.length === 0 && (
        <div className="p-6 rounded-2xl glass-card border border-slate-800 text-center space-y-1 bg-slate-900/40">
          <p className="text-xs sm:text-sm text-slate-400">
            No destination photos found.
          </p>
        </div>
      )}
    </div>
  );
};
