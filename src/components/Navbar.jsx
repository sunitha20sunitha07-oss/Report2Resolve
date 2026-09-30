import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Home, Sparkles, Search, Key, CheckCircle2 } from 'lucide-react';
import { isApiKeyConfigured } from '../services/aiService';

export default function Navbar({ activeTab, setActiveTab, onNavigate, onOpenApiKeyModal }) {
  const [hasKey, setHasKey] = useState(false);

  const checkKey = () => {
    setHasKey(isApiKeyConfigured());
  };

  useEffect(() => {
    checkKey();
    window.addEventListener('gemini_key_updated', checkKey);
    return () => window.removeEventListener('gemini_key_updated', checkKey);
  }, []);

  const handleNavClick = (tab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2.5 gap-y-2 gap-x-4">
          
          {/* Logo & Portal Branding */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-civic-700 to-civic-900 flex items-center justify-center text-white shadow-md shadow-civic-800/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-6 h-6 text-civic-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Report<span className="text-civic-600">2</span>Resolve
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-civic-50 text-civic-700 border border-civic-200">
                  <Sparkles className="w-3 h-3 text-civic-500" />
                  Gemini AI Powered
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Public Service Grievance & Resolution Platform
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('report')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-civic-700 text-white shadow-md shadow-civic-700/25 ring-2 ring-civic-700/20'
                  : 'bg-civic-600 text-white hover:bg-civic-700 shadow-sm'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Report Issue</span>
            </button>

            <button
              type="button"
              id="nav-track-complaint"
              onClick={() => handleNavClick('track')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-civic-700 text-white shadow-md shadow-civic-700/25 ring-2 ring-civic-700/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-xs'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Complaint</span>
            </button>

            {/* In-App Gemini API Key Badge & Manager */}
            {hasKey ? (
              <button 
                type="button"
                onClick={onOpenApiKeyModal}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
                title="Gemini API Key is active in your browser. Click to manage or change."
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Key Active</span>
              </button>
            ) : (
              <button 
                type="button"
                onClick={onOpenApiKeyModal}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all shadow-xs cursor-pointer animate-pulse"
                title="Click to configure your Google Gemini API key"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Set Key</span>
              </button>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
