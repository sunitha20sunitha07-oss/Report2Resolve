import React, { useState } from 'react';
import { 
  Mic, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  Languages, 
  AlertCircle,
  Loader2,
  KeyRound
} from 'lucide-react';
import AnalysisResultsCard from './AnalysisResultsCard';
import { analyzeComplaintWithGemini, isApiKeyConfigured } from '../services/aiService';

export default function ComplaintForm({ onOpenApiKeyModal }) {
  const [complaintText, setComplaintText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Analyzing complaint...');
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');

  const TAMIL_EXAMPLE = "எங்க தெருவுல மூணு நாளா street light எரியல.";

  const handleUseExample = () => {
    setComplaintText(TAMIL_EXAMPLE);
    setValidationError('');
    setError(null);
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    
    const trimmed = complaintText.trim();
    if (!trimmed) {
      setValidationError('Please enter or describe a problem before analyzing.');
      return;
    }

    setValidationError('');
    setError(null);
    setIsLoading(true);
    setLoadingStatus('Analyzing complaint...');

    try {
      const result = await analyzeComplaintWithGemini(trimmed, '', (status) => {
        setLoadingStatus(status);
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Complaint analysis failed:', err);
      setError(err.message || 'Failed to analyze complaint. Please check your network and Gemini API key.');
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
      setLoadingStatus('Analyzing complaint...');
    }
  };

  const handleClear = () => {
    setComplaintText('');
    setAnalysisResult(null);
    setError(null);
    setValidationError('');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-civic-100 text-civic-800">
          <Languages className="w-3.5 h-3.5" />
          <span>Multilingual Grievance Filing (Tamil / English / Tanglish)</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Citizen Problem Registration
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Describe the civic issue in your own words or native language. Google Gemini will extract the key problem details, classify urgency, and route it to the correct department.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Example Tamil Prompt Chip */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Example Tamil Complaint
            </span>
            <p className="text-sm font-medium text-slate-800 font-sans">
              "{TAMIL_EXAMPLE}"
            </p>
          </div>
          <button
            type="button"
            onClick={handleUseExample}
            disabled={isLoading}
            className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50"
          >
            Insert Example
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAnalyze} className="space-y-4">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="complaint-input" 
                className="text-sm font-semibold text-slate-800"
              >
                Describe your grievance
              </label>
              <span className="text-xs text-slate-400">
                {complaintText.length} characters
              </span>
            </div>

            <div className="relative">
              <textarea
                id="complaint-input"
                rows={5}
                value={complaintText}
                disabled={isLoading}
                onChange={(e) => {
                  setComplaintText(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="Example: எங்க தெருவுல மூணு நாளா street light எரியல. Or: Broken water pipeline near main junction causing severe water logging..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 focus:outline-none transition-all text-sm sm:text-base leading-relaxed resize-y disabled:bg-slate-50"
              />

              {/* Voice Input Button Placeholder (Preserved as placeholder per Phase 1 specs) */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  title="Voice Input (Placeholder - Will be enabled in future phase)"
                  className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-medium cursor-not-allowed transition-all"
                >
                  <Mic className="w-4 h-4 text-slate-500 group-hover:text-civic-600" />
                  <span className="hidden sm:inline">Voice Input (Placeholder)</span>
                </button>
              </div>
            </div>

            {validationError && (
              <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-4 h-4" />
                {validationError}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Supports Tamil, English, and Tanglish input.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {complaintText && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-md shadow-civic-600/25 hover:shadow-civic-600/35 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingStatus}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Complaint</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* AI Analysis Display Section */}
      <AnalysisResultsCard 
        result={analysisResult}
        isLoading={isLoading}
        loadingStatus={loadingStatus}
        error={error}
        onRetry={() => handleAnalyze()}
        onOpenApiKeyModal={onOpenApiKeyModal}
      />

    </div>
  );
}
