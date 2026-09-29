import React, { useState, useEffect } from 'react';
import { KeyRound, X, CheckCircle2, ExternalLink, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { getActiveApiKey, saveApiKeyToStorage, clearStoredApiKey } from '../services/aiService';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEnvKey, setIsEnvKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
        setIsEnvKey(true);
        setKeyInput(envKey.trim());
      } else {
        setIsEnvKey(false);
        setKeyInput(getActiveApiKey());
      }
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKeyToStorage(keyInput);
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    clearStoredApiKey();
    setKeyInput('');
    if (onKeySaved) onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-civic-400" />
            <h3 className="font-bold text-base">Gemini API Key Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Report2Resolve uses the real Google Gemini API for multilingual complaint understanding and routing.
          </p>

          {isEnvKey && (
            <div className="p-3 rounded-xl bg-civic-50 border border-civic-200 flex items-center gap-2.5 text-xs text-civic-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-civic-600 shrink-0" />
              <span>API Key detected from <code>.env.local</code> / <code>VITE_GEMINI_API_KEY</code>.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                disabled={isEnvKey}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>Never shared. Stored in your local browser storage.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-civic-600 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Get free key <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>API Key successfully saved!</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            {!isEnvKey && keyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Clear Key
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            {!isEnvKey && (
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-civic-600 hover:bg-civic-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Save Key
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
