import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Terminal, ChevronDown, ChevronUp, Cpu, CheckCircle2, AlertCircle, Wrench, Eye } from 'lucide-react';
import { useTripStore } from '../store/tripStore';

export const AgentActivityPanel = ({ currentAgent = "Coordinator Agent", compact = false }) => {
  const [isOpen, setIsOpen] = useState(true);
  const agentEvents = useTripStore((state) => state.agentEvents);

  const getAgentColor = (name = "") => {
    if (name.includes("Profile")) return "text-blue-500 bg-blue-500/10 border-blue-500/30";
    if (name.includes("Consensus")) return "text-purple-500 bg-purple-500/10 border-purple-500/30";
    if (name.includes("Destination")) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    if (name.includes("Itinerary")) return "text-amber-500 bg-amber-500/10 border-amber-500/30";
    if (name.includes("Replanner")) return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    if (name.includes("Booking")) return "text-teal-500 bg-teal-500/10 border-teal-500/30";
    if (name.includes("Budget")) return "text-indigo-500 bg-indigo-500/10 border-indigo-500/30";
    return "text-cyan-500 bg-cyan-500/10 border-cyan-500/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      {/* Header with live pulse */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-500">
            <Bot className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                Agent Mesh Activity
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                N8N AGENT ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Focus: <span className="text-primary-500 font-medium">{currentAgent}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Toggle Agent Panel"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Stream Feed */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            {agentEvents.length === 0 ? (
              <div className="flex items-center space-x-2 text-xs text-slate-400 py-2 font-mono">
                <Cpu className="w-3.5 h-3.5 text-primary-400 animate-spin" />
                <span>WanderMind AI Agent ready for trip research...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {agentEvents.slice(0, 6).map((evt, idx) => (
                  <motion.div
                    key={evt.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${getAgentColor(evt.agent_name)}`}>
                        {evt.agent_name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{evt.timestamp}</span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {evt.step}
                    </p>

                    {evt.tool_called && (
                      <div className="mt-1 flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <Wrench className="w-3 h-3 text-amber-500" />
                        <span>Tool: <span className="text-amber-500 font-semibold">{evt.tool_called}</span></span>
                      </div>
                    )}

                    {evt.observation && (
                      <div className="mt-1 flex items-start space-x-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Eye className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                        <span>{evt.observation}</span>
                      </div>
                    )}

                    {evt.decision && (
                      <div className="mt-1 flex items-start space-x-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{evt.decision}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
