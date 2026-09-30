import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Trash2, 
  X, 
  Sparkles,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { 
  getActiveApiKey, 
  saveApiKeyToStorage, 
  clearStoredApiKey, 
  verifyApiKey 
} from '../services/aiService';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [currentKey, setCurrentKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existing = getActiveApiKey();
      setCurrentKey(existing);
      setKeyInput(existing ? '••••••••••••••••••••••••••••••••' : '');
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e?.preventDefault();
    const trimmed = keyInput.trim();

    // If input is still the masked bullet string and we already have a key
    if (trimmed.startsWith('••••') && currentKey) {
      setStatusMessage({ type: 'success', text: 'Existing API Key is active.' });
      setTimeout(() => onClose(), 800);
      return;
    }

    if (!trimmed) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    try {
      const verifyResult = await verifyApiKey(trimmed);
      if (!verifyResult.valid) {
        setStatusMessage({
          type: 'error',
          text: verifyResult.error || 'Gemini could not verify this API key. Please check the key.'
        });
        setIsVerifying(false);
        return;
      }

      saveApiKeyToStorage(trimmed);
      setCurrentKey(trimmed);
      setStatusMessage({ type: 'success', text: 'Gemini API Key verified and saved successfully!' });
      if (onKeySaved) onKeySaved(trimmed);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      // If network test failed but format looks okay, still allow saving
      saveApiKeyToStorage(trimmed);
      setCurrentKey(trimmed);
      setStatusMessage({ type: 'success', text: 'Gemini API Key saved.' });
      if (onKeySaved) onKeySaved(trimmed);
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setCurrentKey('');
    setKeyInput('');
    setStatusMessage({ type: 'success', text: 'Stored API key removed.' });
    if (onKeySaved) onKeySaved('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-civic-500/20 text-civic-300 flex items-center justify-center border border-civic-500/30">
              <Key className="w-4 h-4 text-civic-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Google Gemini API Key</h3>
              <p className="text-xs text-slate-400">Configure key for real AI complaint understanding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Key Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Current Key Status:</span>
            {currentKey ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active in Browser
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Not Configured
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="api-key-input" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Enter Gemini API Key
              </label>
              
              <div className="relative">
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="Paste your Gemini API key here (AIza...)"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Status Alert */}
            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {currentKey ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Key</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-civic-600 hover:bg-civic-700 text-white text-xs font-bold shadow-md shadow-civic-600/25 transition-all disabled:opacity-60"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Privacy & Instructions */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Key Privacy & Security</span>
            </div>
            <p className="leading-relaxed">
              Your API key is saved directly in your browser's private storage (<code>localStorage</code>) and is only used to connect to Google Gemini.
            </p>
            <div className="pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-civic-600 hover:text-civic-700 hover:underline"
              >
                <span>Get a free Gemini API key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
