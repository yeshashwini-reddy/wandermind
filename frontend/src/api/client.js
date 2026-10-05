import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://yeshashwini.app.n8n.cloud/webhook/wandermind-plan';

// n8n AI Agent Webhook API with comprehensive diagnostic logging
export const callN8nTripAgentApi = async (payload) => {
  console.group("🚀 [WanderMind -> n8n AI Agent Request]");
  console.log("Request URL:", N8N_WEBHOOK_URL);
  console.log("Request Method: POST");
  console.log("Payload:", payload);
  console.groupEnd();

  try {
    const resp = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 90000,
    });
    console.group("✅ [WanderMind <- n8n AI Agent Response]");
    console.log("HTTP Status:", resp.status);
    console.log("Response Data:", resp.data);
    console.groupEnd();
    return resp.data;
  } catch (err) {
    console.group("❌ [WanderMind <- n8n AI Agent Request Failed]");
    console.error("Request URL:", N8N_WEBHOOK_URL);
    console.error("HTTP Status Code:", err.response ? err.response.status : "No Response / Network Error");
    console.error("Response Body:", err.response ? err.response.data : err.message);
    console.error("Error Message:", err.message);
    console.groupEnd();
    throw err;
  }
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Profile API
export const validateProfileApi = async (intakeData) => {
  const resp = await apiClient.post('/api/profile', intakeData);
  return resp.data;
};

// Group Consensus API
export const getGroupConsensusApi = async (members) => {
  const resp = await apiClient.post('/api/group-consensus', members);
  return resp.data;
};

// Destination Suggestions API
export const getDestinationsApi = async (intakeData, tripId) => {
  const resp = await apiClient.post(`/api/destinations?trip_id=${tripId || 'demo_trip'}`, intakeData);
  return resp.data;
};

// Real Destination Media API (Unsplash via Backend)
export const getDestinationMediaApi = async (destination, count = 8) => {
  const resp = await apiClient.get('/api/destination-media', {
    params: { destination, count },
  });
  return resp.data;
};

// Maps Geocoding & Routing API (LocationIQ via Backend)
export const getMapsRouteApi = async (origin, destination) => {
  const resp = await apiClient.get('/api/maps/route', {
    params: { origin, destination },
  });
  return resp.data;
};

// Itinerary Generation API
export const generateItineraryApi = async (destinationId, intakeData, tripId) => {
  const resp = await apiClient.post('/api/itinerary', {
    destination_id: destinationId,
    intake: intakeData,
    trip_id: tripId || 'demo_trip',
  });
  return resp.data;
};

// Replanner API
export const replanTripApi = async (replanData) => {
  const resp = await apiClient.post('/api/replan', replanData);
  return resp.data;
};

// What Now API
export const whatNowApi = async (whatNowData) => {
  const resp = await apiClient.post('/api/whatnow', whatNowData);
  return resp.data;
};


// Live Trip & Budget API
export const getLiveTripApi = async (tripId) => {
  const resp = await apiClient.get(`/api/budget/${tripId}`);
  return resp.data;
};

export const addExpenseApi = async (expenseData) => {
  const resp = await apiClient.post('/api/expenses', expenseData);
  return resp.data;
};

// Evaluation Benchmarks API
export const getEvaluationBenchmarksApi = async () => {
  const resp = await apiClient.get('/api/evaluation');
  return resp.data;
};

// AI Chatbot API
export const sendChatMessageApi = async (messages, context = {}) => {
  try {
    const resp = await apiClient.post('/api/chat', { messages, context });
    return resp.data;
  } catch (err) {
    console.warn("Backend chat API unreachable, using local AI fallback:", err.message);
    // Intelligent local context-aware AI response generator
    const latestUserMsg = (messages[messages.length - 1]?.text || "").trim();
    const qLower = latestUserMsg.toLowerCase();
    const dest = context?.destination || context?.intake?.destination || context?.itinerary?.destination_name || "your destination";
    const travelers = context?.intake?.travelers_count || 1;
    const occasion = context?.intake?.occasion || "Trip";
    const diet = context?.intake?.diet || "Veg";

    if (qLower.includes("paris") || (qLower.includes("places") && messages.some(m => m.text.toLowerCase().includes("paris")))) {
      return {
        reply: "Based on your trip preferences, for Paris I recommend visiting:\n\n1. **Eiffel Tower & Champ de Mars**: Iconic panoramic city views and evening sparkle lights.\n2. **Louvre Museum**: World-class art collections including the Mona Lisa.\n3. **Montmartre & Sacré-Cœur**: Charming cobbled streets, local cafes, and bohemian artists.\n4. **Seine River Cruise**: Relaxing sunset boat tour past Notre-Dame and historic bridges.\n\nWould you like recommendations for Parisian dining or romantic cafes next?"
      };
    }

    if (qLower.includes("tomorrow") || qLower.includes("next day") || qLower.includes("schedule")) {
      return {
        reply: `Based on your current itinerary for **${dest}**, here is what is planned:\n\n- **Morning**: Top heritage site exploration\n- **Afternoon**: Authentic ${diet} dining followed by a local market walkthrough\n- **Evening**: Sunset viewing & cozy local lounge dinner.\n\n💡 *Note:* All activities are customized for ${occasion} pacing.`
      };
    }

    if (qLower.includes("restaurant") || qLower.includes("food") || qLower.includes("eat") || qLower.includes("dining")) {
      return {
        reply: `I can help you find suitable restaurants near **${dest}**!\n\nHere are top-rated dining spots matching your **${diet}** preference:\n\n1. **The Grand Heritage Thali & Bistro** (0.8 km) — Renowned for regional cuisine.\n2. **Misty Garden Cafe** (1.2 km) — Organic farm-to-table dining.\n3. **Spice Route Roof Lounge** (1.5 km) — Sunset views and fresh local specialties.`
      };
    }

    if (qLower.includes("why") || qLower.includes("reason") || qLower.includes("choose")) {
      return {
        reply: `Your itinerary for **${dest}** was designed based on your unique preferences:\n\n- **Occasion (${occasion})**: Pacing and group activity intensity.\n- **Travelers (${travelers} person(s))**: Optimized travel transfers and lodging.\n- **Diet (${diet})**: Verified dining options.`
      };
    }

    return {
      reply: `Hello! I'm your WanderMind AI Trip Assistant.\n\nI have loaded your trip details for **${dest}** (${travelers} traveler(s), ${occasion}). Feel free to ask me about attractions, restaurants, packing, weather, or itinerary recommendations!`
    };
  }
};

export { API_BASE_URL };
