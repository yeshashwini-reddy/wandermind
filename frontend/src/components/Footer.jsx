import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart, Sparkles, Cpu } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md pb-16 lg:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Problem Statement */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                WanderMind
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 font-mono font-bold">
                AI Agent Mesh
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              <strong>Problem Statement:</strong> Static itineraries break when reality changes (rain, train delays, closed monuments, or group disagreements). WanderMind is an autonomous multi-agent system that dynamically replans your journey in real time with verifiable constraints.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Hard constraints guaranteed: Strict Budget, Diet Safety & Elder Mobility.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              AI Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/plan" className="hover:text-orange-400 transition-colors">Smart Intake Wizard</Link></li>
              <li><Link to="/destinations" className="hover:text-orange-400 transition-colors">Destination Match Engine</Link></li>
              <li><Link to="/evaluation" className="hover:text-orange-400 transition-colors">Automated Benchmarks</Link></li>
            </ul>
          </div>

          {/* Academic Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Academic Project
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Built for <strong>Fundamentals of Artificial Intelligence</strong>. Demonstrates Multi-Agent Systems, Hard Constraint Optimization & Real-Time Event-Driven Replanning.
            </p>
            <span className="inline-flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
              <Cpu className="w-3 h-3 text-orange-400" />
              <span>FastAPI • React 18 • LangGraph</span>
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} WanderMind Multi-Agent Systems. All demo data simulated for evaluation.</p>
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Autonomous Real-Time Trip Optimization</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
