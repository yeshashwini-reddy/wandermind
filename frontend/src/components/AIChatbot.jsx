import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Compass, Bot, RefreshCw } from 'lucide-react';
import { useTripStore } from '../store/tripStore';

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Extract WanderMind state for trip-context awareness
  const intake = useTripStore((state) => state.intake);
  const itinerary = useTripStore((state) => state.itinerary);
  const selectedDestination = useTripStore((state) => state.selectedDestination);
  const user = useTripStore((state) => state.user);

  // Initial Assistant Message
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am WanderMind AI, your intelligent travel assistant. Ask me anything about destinations, local attractions, dining recommendations, packing tips, or your customized itinerary!"
    }
  ]);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Quick Prompt Pills
  const quickPrompts = [
    "Which places should I visit in Paris?",
    "What should I do tomorrow?",
    "Suggest restaurants near my destination",
    "Why did you choose this itinerary?"
  ];

  // Local response matcher system (No API/Network calls required)
  const getDemoResponse = (queryText) => {
    const q = queryText.toLowerCase().trim();

    if (q.includes("paris")) {
      return "Paris has many wonderful places to explore! You could visit the Eiffel Tower, Louvre Museum, Notre-Dame, Montmartre, and the Champs-Élysées. For a relaxed experience, I would recommend exploring Montmartre in the evening.";
    }
    if (q.includes("tomorrow") || q.includes("schedule")) {
      return "Based on your trip, you could start the morning with a local sightseeing activity, enjoy lunch at a nearby restaurant, and keep the afternoon flexible for exploring. I recommend leaving some free time in case you discover something interesting.";
    }
    if (q.includes("restaurant") || q.includes("dining") || q.includes("food") || q.includes("eat")) {
      return "I can suggest a few options based on your destination. For this demo, consider trying a highly-rated local restaurant, a casual café for lunch, and a traditional restaurant for dinner.";
    }
    if (q.includes("why did you choose") || q.includes("why") || q.includes("itinerary")) {
      return "The itinerary is designed to balance sightseeing, travel time, relaxation, and memorable experiences. The activities are grouped by location where possible so you spend less time travelling between places.";
    }
    if (q === "hii" || q === "hi" || q === "hello" || q.startsWith("hello") || q.startsWith("hii")) {
      return "Hello! 👋 I'm WanderMind AI. I'm here to help you explore destinations, plan activities, and make your trip more enjoyable.";
    }
    if (q.includes("what can you do") || q.includes("help")) {
      return "I can help you with destinations, activities, restaurants, packing ideas, itinerary suggestions, and general travel questions. This is currently a demo version using local responses.";
    }
    if (q.includes("packing") || q.includes("pack")) {
      return "For packing, I recommend weather-appropriate clothes, comfortable walking shoes, essential toiletries, a power bank, and any required travel documents.";
    }

    const demoResponses = [
      "That's a great question! I would recommend planning your day around the activities you enjoy most.",
      "Absolutely! I can help you organize your trip and make the schedule more comfortable.",
      "That sounds interesting! For this demo, I would suggest checking the destination highlights and keeping some free time for exploration.",
      "A good travel plan should balance sightseeing, food, relaxation, and travel time.",
      "I'd recommend exploring popular attractions first and then leaving some time for local experiences."
    ];

    const randomIndex = Math.floor(Math.random() * demoResponses.length);
    return demoResponses[randomIndex];
  };

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText || isLoading) return;

    // Add User Message immediately
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: queryText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Realistic typing delay (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const replyText = getDemoResponse(queryText);

    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai',
      text: replyText
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to format AI response text (bolding & linebreaks)
  const formatText = (text) => {
    if (!text) return '';
    const paragraphs = text.split('\n');
    return paragraphs.map((para, i) => {
      if (!para.trim()) return <br key={i} />;
      
      // Simple inline bold replacement (**text**)
      const parts = para.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
          {formattedParts}
        </p>
      );
    });
  };

  const activeDestination = selectedDestination?.name || itinerary?.destination_name || intake?.destination;

  return (
    <>
      {/* Floating Circular AI Assistant Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/30 flex items-center justify-center cursor-pointer border border-orange-400/40 focus:outline-none"
        aria-label="Toggle WanderMind AI Assistant"
      >
        <div className="relative">
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6 animate-pulse" />
          )}
          {/* Subtle Online Status Dot */}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#070b14]" />
        </div>
      </motion.button>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] h-[500px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border border-slate-800 bg-[#0b1222]/98 backdrop-blur-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                  <Compass className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight flex items-center space-x-1.5">
                    <span>WanderMind AI Assistant</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold">
                      AI Agent
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Your intelligent travel companion
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context Header Badge (if active trip exists) */}
            {activeDestination && (
              <div className="px-4 py-1.5 bg-slate-900/50 border-b border-slate-800/50 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
                <span className="truncate">
                  📍 Active Context: <strong className="text-orange-400 font-semibold">{activeDestination}</strong> ({intake?.travelers_count || 1} traveler{intake?.travelers_count > 1 ? 's' : ''})
                </span>
                <span className="text-emerald-400 font-medium shrink-0 ml-2">Synced</span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-tr-none shadow-md shadow-orange-500/15 font-medium'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.sender === 'ai' ? formatText(msg.text) : msg.text}
                  </div>
                </div>
              ))}

              {/* Typing / Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/90 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3 text-xs flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts (Always visible and clickable) */}
            <div className="px-3 py-1.5 border-t border-slate-800/40 bg-slate-950/40 shrink-0">
              <p className="text-[10px] text-slate-500 font-medium mb-1.5 px-1">Suggested questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                    className="text-[10px] text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/40 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-all text-left truncate max-w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask WanderMind AI..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/60 transition-all"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-orange-500 transition-all cursor-pointer shadow-md shadow-orange-500/20 shrink-0"
                aria-label="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
