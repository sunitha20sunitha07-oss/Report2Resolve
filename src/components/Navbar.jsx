import React from 'react';
import { ShieldCheck, FileText, Home, Sparkles, KeyRound } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenApiKeyModal, isKeyConfigured }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Portal Branding */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-civic-700 to-civic-900 flex items-center justify-center text-white shadow-md shadow-civic-800/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-6 h-6 text-civic-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Report<span className="text-civic-600">2</span>Resolve
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-civic-50 text-civic-700 border border-civic-200">
                  <Sparkles className="w-3 h-3 text-civic-500" />
                  Gemini AI Powered
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Public Service Grievance & Resolution Platform
              </p>
            </div>
          </div>

          {/* Navigation & API Key Controls */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'report'
                  ? 'bg-civic-700 text-white shadow-md shadow-civic-700/25 ring-2 ring-civic-700/20'
                  : 'bg-civic-600 text-white hover:bg-civic-700 shadow-sm'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Report a Problem</span>
            </button>

            {/* API Key Manager Button */}
            <button
              onClick={onOpenApiKeyModal}
              title="Configure Google Gemini API Key"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                isKeyConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 animate-pulse'
              }`}
            >
              <KeyRound className={`w-3.5 h-3.5 ${isKeyConfigured ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden md:inline">
                {isKeyConfigured ? 'Gemini Key Active' : 'Set Gemini Key'}
              </span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
