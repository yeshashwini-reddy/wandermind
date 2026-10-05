import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Volume2, Globe } from 'lucide-react';
import { useTripStore } from '../store/tripStore';

export const StoryModeModal = ({ isOpen, onClose, destinationName, storyText, translations = {} }) => {
  const language = useTripStore((state) => state.language);
  const setLanguage = useTripStore((state) => state.setLanguage);

  if (!isOpen) return null;

  const currentNarrative =
    language === 'hi' && translations?.hi?.narrative
      ? translations.hi.narrative
      : language === 'te' && translations?.te?.narrative
      ? translations.te.narrative
      : storyText;

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentNarrative);
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'te') utterance.lang = 'te-IN';
      else utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-primary-500/30 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Story Mode: Journey to {destinationName}
                </h3>
                <p className="text-xs text-slate-400">AI-crafted narrative experience</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language selector in modal */}
          <div className="flex items-center space-x-2 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Read in:</span>
            {['en', 'hi', 'te'].map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 rounded-lg uppercase font-bold transition-all ${
                  language === l
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
              </button>
            ))}
          </div>

          {/* Narrative Text */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 leading-relaxed text-sm sm:text-base font-serif italic max-h-72 overflow-y-auto">
            "{currentNarrative}"
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSpeech}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-primary-500" />
              <span>Read Aloud (TTS)</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 shadow-md transition-all"
            >
              Done Reading
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
