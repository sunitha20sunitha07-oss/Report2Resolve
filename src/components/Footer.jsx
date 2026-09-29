import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-civic-700" />
            <span className="text-sm font-bold text-slate-800">
              Report<span className="text-civic-600">2</span>Resolve
            </span>
            <span className="text-xs text-slate-400">| Google Hackathon Project</span>
          </div>

          <p className="text-xs text-slate-500">
            Phase 1 Foundation • AI Civic Governance Platform
          </p>

          <p className="text-xs text-slate-400 flex items-center gap-1">
            Built for citizen empowerment & transparent public resolution
          </p>

        </div>
      </div>
    </footer>
  );
}
