import React from 'react';
import { Layers, Clock, AlertTriangle, Cpu } from 'lucide-react';

export const ModulePlaceholderCard = ({ 
  moduleNumber, 
  title, 
  description, 
  features = [], 
  techStack = [], 
  status = "Architecture Initialized - Awaiting Phase Implementation" 
}) => {
  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Module 0{moduleNumber}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-medium self-start md:self-auto">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{status}</span>
          </div>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Stage Notice: Module Pending Implementation</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            This module interface placeholder is established to structure the application navigation and state model. 
            No simulated or fake calculations are performed at this stage. Logic will be attached during subsequent development phases.
          </p>
        </div>
      </div>

      {/* Planned Features & Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planned Capabilities */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Planned Capabilities
          </h3>
          <ul className="space-y-3 text-xs text-slate-300">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Components */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Module Tech Integration
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {techStack.map((tech, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 text-xs">
                {tech}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Backend API endpoints and ML microservices for this module will be connected via Express controllers once implemented.
          </p>
        </div>
      </div>
    </div>
  );
};
