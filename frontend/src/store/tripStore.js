import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

// Helper function to load initial user from localStorage
const getInitialUser = () => {
  try {
    const stored = localStorage.getItem('wandermind_user');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

// Helper function to load initial saved trips from localStorage
const getInitialTrips = () => {
  try {
    const stored = localStorage.getItem('wandermind_trips');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const useTripStore = create((set, get) => ({
  // Authentication State
  user: getInitialUser(),
  setUser: (userObj) => {
    if (userObj) {
      localStorage.setItem('wandermind_user', JSON.stringify(userObj));
    } else {
      localStorage.removeItem('wandermind_user');
      localStorage.removeItem('wandermind_trips');
    }
    set({ user: userObj, savedTrips: userObj ? get().savedTrips : [] });
  },
  logout: () => {
    localStorage.removeItem('wandermind_user');
    localStorage.removeItem('wandermind_trips');
    set({ user: null, savedTrips: [] });
  },

  // Saved Trips List & Supabase Fetching
  savedTrips: getInitialTrips(),

  fetchUserTrips: async (userId) => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((t) => ({
          id: t.trip_data?.id || t.id,
          destination: t.destination,
          dates: t.trip_data?.dates || (t.start_date ? `${t.start_date}` : 'Upcoming Trip'),
          travelers: t.travelers || 1,
          status: t.trip_status ? (t.trip_status.charAt(0).toUpperCase() + t.trip_status.slice(1)) : 'Planned',
          amount: t.trip_data?.amount || null,
          bookingId: t.trip_data?.bookingId || null,
          createdAt: t.created_at
        }));
        set({ savedTrips: mapped });
        localStorage.setItem('wandermind_trips', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error("Error fetching Supabase trips:", err);
    }
    return get().savedTrips;
  },

  addSavedTrip: async (trip) => {
    set((state) => {
      const updated = [trip, ...state.savedTrips.filter(t => t.id !== trip.id)];
      localStorage.setItem('wandermind_trips', JSON.stringify(updated));
      return { savedTrips: updated };
    });

    const user = get().user;
    if (user?.id) {
      try {
        await supabase.from('trips').insert([
          {
            user_id: user.id,
            destination: trip.destination || 'Destination',
            start_date: get().intake?.start_date || null,
            end_date: null,
            travelers: trip.travelers || 1,
            trip_status: trip.status ? trip.status.toLowerCase() : 'planned',
            trip_data: {
              id: trip.id,
              dates: trip.dates,
              amount: trip.amount,
              bookingId: trip.bookingId
            }
          }
        ]);
      } catch (err) {
        console.error("Error persisting trip to Supabase:", err);
      }
    }
  },

  // Active Trip Identification
  tripId: `trip_${Math.floor(Math.random() * 899999 + 100000)}`,
  setTripId: (id) => set({ tripId: id }),

  // Intake State
  intake: {
    occasion: "Family",
    travelers_count: 4,
    ages: [65, 38, 35, 8],
    has_elders: true,
    has_kids: true,
    mobility_limits: true,
    elder_mode: true,
    kid_mode: true,
    start_city: "Hyderabad",
    destination: "Delhi",
    start_date: "2026-10-15",
    duration_days: 4,
    total_budget: 12000,
    priority: "comfort",
    vibes: ["Cultural", "Relaxed"],
    diet: "Veg",
    fears: ["Steep heights / Trekking"],
    hidden_gem_preference: false,
    theme_trip: null,
    eco_mode: false,
    surprise_me: false,
    group_mode: false,
    group_members: [
      { name: "Rajesh", vibe: "Cultural", diet: "Veg", pace: "Moderate", fears_or_dislikes: ["Long drives"] },
      { name: "Priya", vibe: "Relaxed", diet: "Veg", pace: "Slow", fears_or_dislikes: ["Extreme heat"] },
      { name: "Rohan", vibe: "Adventure", diet: "Non-veg", pace: "Fast", fears_or_dislikes: [] },
      { name: "Ananya", vibe: "Foodie", diet: "Veg", pace: "Moderate", fears_or_dislikes: ["Crowds"] }
    ],
    personality_quiz_answers: {}
  },
  updateIntake: (updates) => set((state) => {
    const nextIntake = { ...state.intake, ...updates };
    const occasion = nextIntake.occasion;
    if (occasion === "Solo" || occasion === "Solo Explorer") {
      nextIntake.travelers_count = 1;
      nextIntake.elder_mode = false;
      nextIntake.kid_mode = false;
      nextIntake.mobility_limits = false;
      nextIntake.has_elders = false;
      nextIntake.has_kids = false;
    } else if (occasion === "Honeymoon" || occasion === "Romantic Honeymoon") {
      nextIntake.travelers_count = 2;
      nextIntake.elder_mode = false;
      nextIntake.kid_mode = false;
      nextIntake.mobility_limits = false;
      nextIntake.has_elders = false;
      nextIntake.has_kids = false;
    }
    return { intake: nextIntake };
  }),


  // Profile Validation Result
  profileValidation: null,
  setProfileValidation: (val) => set({ profileValidation: val }),

  // n8n WanderMind AI Agent Result
  agentResult: null,
  setAgentResult: (result) => set({ agentResult: result }),

  // Group Consensus Result
  groupConsensus: null,
  setGroupConsensus: (val) => set({ groupConsensus: val }),

  // Suggested Destinations
  destinations: [],
  selectedDestination: null,
  coordinatorSummary: "",
  setDestinations: (dests, summary = "") => set({ destinations: dests, coordinatorSummary: summary }),
  setSelectedDestination: (dest) => set({ selectedDestination: dest }),

  // Generated Itinerary
  itinerary: null,
  activeDayIndex: 1,
  setActiveDayIndex: (idx) => set({ activeDayIndex: idx }),
  setItinerary: (itin) => {
    set((state) => {
      let updatedTrips = state.savedTrips;
      if (itin) {
        const newTrip = {
          id: state.tripId,
          destination: itin.destination_name || state.selectedDestination?.name || "Goa",
          dates: `${state.intake?.start_date || '2026-11-10'} (${itin.total_days || state.intake?.duration_days || 3} Days)`,
          travelers: state.intake?.travelers_count || 4,
          status: "Planned",
          amount: itin.estimated_total_cost || 25000,
          bookingId: null,
          createdAt: new Date().toISOString()
        };
        updatedTrips = [newTrip, ...state.savedTrips.filter(t => t.id !== newTrip.id)];
        localStorage.setItem('wandermind_trips', JSON.stringify(updatedTrips));

        // Asynchronously persist to Supabase if authenticated
        const currentUser = state.user;
        if (currentUser?.id) {
          supabase.from('trips').insert([
            {
              user_id: currentUser.id,
              destination: newTrip.destination,
              start_date: state.intake?.start_date || null,
              end_date: null,
              travelers: newTrip.travelers,
              trip_status: 'planned',
              trip_data: {
                id: newTrip.id,
                dates: newTrip.dates,
                amount: newTrip.amount,
                bookingId: newTrip.bookingId,
                itinerary_data: itin
              }
            }
          ]).then(({ error }) => {
            if (error) console.error("Error inserting trip into Supabase:", error);
          });
        }
      }
      return { itinerary: itin, savedTrips: updatedTrips };
    });
  },

  // Replanning State
  replanDiffs: [],
  latestReplanResponse: null,
  isReplanning: false,
  setIsReplanning: (val) => set({ isReplanning: val }),
  setReplanResult: (res) => {
    set((state) => {
      // Update day plan in itinerary if available
      let updatedItin = state.itinerary;
      if (updatedItin && res.updated_day_plan) {
        const newDays = updatedItin.days.map((d) =>
          d.day_number === res.updated_day_plan.day_number ? res.updated_day_plan : d
        );
        updatedItin = { ...updatedItin, days: newDays };
      }
      return {
        latestReplanResponse: res,
        replanDiffs: res.before_vs_after_diffs || [],
        itinerary: updatedItin,
        isReplanning: false
      };
    });
  },

  // Booking State
  bookingSearchData: null,
  selectedTransport: null,
  selectedStay: null,
  confirmedReceipt: null,
  setBookingSearchData: (data) => set({
    bookingSearchData: data,
    selectedTransport: data.ai_recommended_package?.transport || data.transport_options[0],
    selectedStay: data.ai_recommended_package?.stay || data.stay_options[0]
  }),
  setSelectedTransport: (t) => set({ selectedTransport: t }),
  setSelectedStay: (s) => set({ selectedStay: s }),
  setConfirmedReceipt: (r) => set({ confirmedReceipt: r }),

  // Live Trip & Expenses
  liveTripData: null,
  setLiveTripData: (data) => set({ liveTripData: data }),

  // Agent Activity Event Stream (SSE)
  agentEvents: [],
  addAgentEvent: (evt) => set((state) => ({
    agentEvents: [evt, ...state.agentEvents].slice(0, 30) // Keep last 30 events
  })),
  clearAgentEvents: () => set({ agentEvents: [] }),

  // Global UI State
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  storyModeOpen: false,
  setStoryModeOpen: (isOpen) => set({ storyModeOpen: isOpen })
}));
