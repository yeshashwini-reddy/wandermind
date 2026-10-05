export const OCCASIONS = [
  { id: "Family", title: "Family Vacation", icon: "Users", desc: "Multigenerational pacing, kid & elder comfort" },
  { id: "Honeymoon", title: "Romantic Honeymoon", icon: "Heart", desc: "Scenic vistas, intimate stays & candlelit dining" },
  { id: "Friends", title: "Friends Getaway", icon: "Sparkles", desc: "Shared adventures, vibrant cafes & nightlife" },
  { id: "Solo", title: "Solo Explorer", icon: "Compass", desc: "Authentic discovery, flexibility & safety" },
  { id: "Pilgrimage", title: "Pilgrimage / Spiritual", icon: "Moon", desc: "Sacred darshan, peaceful temple corridors & vegetarian food" },
  { id: "School trip", title: "Educational & School", icon: "GraduationCap", desc: "Interactive science, history & group coordination" }
];

export const VIBES = [
  { id: "Adventure", label: "Adventure & Sports", color: "from-amber-500 to-orange-500", icon: "Mountain" },
  { id: "Relaxed", label: "Relaxed & Serene", color: "from-teal-400 to-emerald-500", icon: "Coffee" },
  { id: "Cultural", label: "Cultural & Heritage", color: "from-purple-500 to-indigo-500", icon: "Landmark" },
  { id: "Nightlife", label: "Nightlife & Social", color: "from-pink-500 to-rose-500", icon: "Music" },
  { id: "Nature", label: "Nature & Wildlife", color: "from-emerald-400 to-teal-600", icon: "Palmtree" },
  { id: "Foodie", label: "Foodie & Culinary", color: "from-orange-400 to-red-500", icon: "Utensils" }
];

export const DIETS = [
  { id: "Veg", label: "Vegetarian", desc: "Pure vegetarian with milk & dairy" },
  { id: "Non-veg", label: "Non-Vegetarian", desc: "Seafood, poultry, and meat dishes" },
  { id: "Jain", label: "Strict Jain", desc: "No onion, garlic, or root vegetables" },
  { id: "Halal", label: "Halal Certified", desc: "Strict halal poultry and meat" }
];

export const FEARS_LIST = [
  "Steep heights / Trekking",
  "Deep ocean water",
  "Crowded closed spaces",
  "Rough winding roads (Motion sickness)",
  "Loud nightlife music"
];

export const PERSONALITY_QUIZ = [
  {
    id: "q1",
    question: "When you arrive at a new city, what is your first instinct?",
    options: [
      { text: "Drop bags and explore the oldest heritage monuments", trait: "Cultural" },
      { text: "Find a scenic cozy cafe with local specialty tea/coffee", trait: "Relaxed" },
      { text: "Head straight for an outdoor trek or water sports", trait: "Adventure" },
      { text: "Hunt down famous street food stalls and bakeries", trait: "Foodie" }
    ]
  },
  {
    id: "q2",
    question: "How do you prefer your afternoon schedule?",
    options: [
      { text: "High-paced: Pack as many sights as possible", trait: "Fast" },
      { text: "Serene: Sit-down lunch followed by a relaxed museum", trait: "Moderate" },
      { text: "Rejuvenating: Nap or spa before evening sunset", trait: "Slow" }
    ]
  },
  {
    id: "q3",
    question: "What makes an accommodation feel magical to you?",
    options: [
      { text: "Heritage arches, antique chandeliers, royal courtyard", trait: "Heritage" },
      { text: "Private balcony looking out at misty tea hills or ocean waves", trait: "Scenic" },
      { text: "Trendy co-living hub with live acoustic guitar & traveler talks", trait: "Social" },
      { text: "Eco-friendly wooden cottage in the middle of spice estates", trait: "Eco" }
    ]
  },
  {
    id: "q4",
    question: "If sudden heavy rain breaks out, what is your dream backup plan?",
    options: [
      { text: "An ancient museum with fascinating royal stories", trait: "Cultural" },
      { text: "A warm culinary workshop cooking regional delicacies", trait: "Foodie" },
      { text: "A rooftop glass lounge with hot chai and rain views", trait: "Relaxed" }
    ]
  },
  {
    id: "q5",
    question: "What is the #1 souvenir you want to take home?",
    options: [
      { text: "Handwoven textiles or local artisan pottery", trait: "Culture" },
      { text: "Single-origin whole spice blends and gourmet tea/coffee", trait: "Taste" },
      { text: "Stunning cinematic drone-like landscape photos", trait: "Memories" }
    ]
  }
];

export const TRANSLATIONS = {
  en: {
    hero_title: "Adaptive AI Travel Mesh",
    hero_subtitle: "The First Autonomous Trip Planner That Replans in Real Time When Reality Changes.",
    plan_trip: "Plan Trip",
    home: "Home",
    plan: "Plan",
    destinations: "Destinations",
    itinerary: "Itinerary",
    booking: "Booking",
    live_trip: "Live Trip",
    evaluation: "Evaluation"
  },
  hi: {
    hero_title: "अनुकूली एआई यात्रा योजनाकार",
    hero_subtitle: "पहला स्वायत्त यात्रा योजनाकार जो मौसम और परिस्थितियों के बदलने पर रियल-टाइम में रीप्लान करता है।",
    plan_trip: "यात्रा बनाएं",
    home: "होम",
    plan: "प्लान",
    destinations: "गंतव्य",
    itinerary: "यात्रा कार्यक्रम",
    booking: "बुकिंग",
    live_trip: "लाइव यात्रा",
    evaluation: "मूल्यांकन"
  },
  te: {
    hero_title: "రియల్-టైమ్ అడాప్టివ్ AI ట్రావెల్ ప్లానర్",
    hero_subtitle: "పరిస్థితులు మరియు వాతావరణం మారినప్పుడు వెంటనే స్వయంగా ప్లాన్ మార్చే సరికొత్త ఆర్టిఫిషియల్ ఇంటెలిజెన్స్.",
    plan_trip: "ప్లాన్ ట్రిప్",
    home: "హోమ్",
    plan: "ప్లాన్",
    destinations: "గమ్యస్థానాలు",
    itinerary: "ప్రయాణ ప్రణాళిక",
    booking: "బుకింగ్",
    live_trip: "లైవ్ ట్రిప్",
    evaluation: "మూల్యాంకనం"
  }
};
