import React from 'react';
import { 
  Cpu, 
  Tag, 
  AlertTriangle, 
  Building2, 
  HelpCircle, 
  Info,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Flame,
  ShieldAlert,
  Clock,
  KeyRound,
  FileCheck2,
  ArrowRight
} from 'lucide-react';

export default function AnalysisResultsCard({ 
  result, 
  isLoading, 
  loadingStatus,
  error, 
  onRetry,
  onOpenApiKeyModal,
  onCreateComplaint
}) {
  // Helper to determine styling based on priority
  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-800',
          dot: 'bg-rose-600',
          icon: Flame,
          label: 'Critical Priority (Immediate Action Required)'
        };
      case 'high':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-800',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'High Priority (Urgent Civic Attention)'
        };
      case 'medium':
        return {
          bg: 'bg-blue-50 border-blue-300 text-blue-800',
          dot: 'bg-blue-600',
          icon: Clock,
          label: 'Medium Priority (Normal Resolution)'
        };
      case 'low':
      default:
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-800',
          dot: 'bg-slate-500',
          icon: Info,
          label: 'Low Priority (Standard Queue)'
        };
    }
  };

  const priorityMeta = result ? getPriorityBadge(result.priority) : null;
  const PriorityIcon = priorityMeta?.icon || AlertTriangle;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-civic-500/20 text-civic-400 flex items-center justify-center border border-civic-500/30">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-civic-400 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4 text-civic-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">AI Complaint Analysis</h3>
            <p className="text-xs text-slate-400">Automated classification & municipal dispatch routing</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-civic-900/60 text-civic-300 border border-civic-700/60">
          <Sparkles className="w-3 h-3 text-civic-400" />
          {result ? 'Gemini 3.8 Flash Verified' : 'Gemini AI Engine'}
        </span>
      </div>

      <div className="p-6 space-y-6">

        {/* 1. Loading State */}
        {isLoading && (
          <div className="p-8 rounded-xl bg-civic-50/70 border border-civic-200 text-center space-y-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-civic-100 text-civic-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-civic-900 text-base">
                {loadingStatus || 'Analyzing complaint with Gemini AI...'}
              </h4>
              <p className="text-xs sm:text-sm text-civic-700 max-w-md mx-auto">
                {loadingStatus && loadingStatus.includes('Retrying')
                  ? 'Gemini model is currently experiencing high demand. Automatically retrying with exponential backoff...'
                  : 'Parsing language nuances, assessing civic severity, and determining responsible department...'}
              </p>
            </div>
          </div>
        )}

        {/* 2. Error State */}
        {!isLoading && error && (
          <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-sm text-rose-800">Analysis Failed</h4>
                <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/60">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Analysis</span>
                </button>
              )}

              {error.toLowerCase().includes('api key') && onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                  <span>Configure API Key</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Empty / Initial State (Removed after successful analysis) */}
        {!isLoading && !error && !result && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-medium text-slate-800">
                Ready for AI Understanding
              </p>
              <p className="text-slate-600 leading-relaxed">
                Enter your grievance in Tamil, English, or Tanglish above and click <strong>"Analyze Complaint"</strong>. 
                Google Gemini will instantly identify the problem, assign category, evaluate priority, and route to the correct municipal authority.
              </p>
            </div>
          </div>
        )}

        {/* 4. Real Gemini Results Display */}
        {!isLoading && !error && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Grievance successfully analyzed and categorized by Google Gemini AI</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 1. Problem Description */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Info className="w-4 h-4 text-civic-600" />
                  <span>Problem Description</span>
                </div>
                <div className="min-h-[48px] flex items-center">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {result.problem}
                  </p>
                </div>
              </div>

              {/* 2. Category */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>Category</span>
                </div>
                <div className="min-h-[48px] flex items-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {result.category}
                  </span>
                </div>
              </div>

              {/* 3. Priority */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <PriorityIcon className="w-4 h-4 text-amber-600" />
                  <span>Assessed Priority</span>
                </div>
                <div className="min-h-[48px] flex items-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${priorityMeta.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${priorityMeta.dot}`} />
                    {result.priority}
                  </span>
                </div>
              </div>

              {/* 4. Designated Department */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Designated Department</span>
                </div>
                <div className="min-h-[48px] flex items-center">
                  <p className="text-sm font-bold text-slate-800 leading-snug flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{result.department}</span>
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Static placeholder boxes when no analysis has run yet */}
        {!isLoading && !error && !result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-75">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Info className="w-4 h-4 text-slate-400" />
                <span>Problem Description</span>
              </div>
              <p className="text-sm text-slate-400 italic">Awaiting complaint input...</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Tag className="w-4 h-4 text-slate-400" />
                <span>Category</span>
              </div>
              <p className="text-sm text-slate-400 italic">e.g. Street Lighting / Electrical</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span>Priority Level</span>
              </div>
              <p className="text-sm text-slate-400 italic">e.g. Critical, High, Medium, Low</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Designated Department</span>
              </div>
              <p className="text-sm text-slate-400 italic">e.g. Municipal Electrical Department</p>
            </div>
          </div>
        )}

        {/* Footer info box */}
        <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
          <span>Output Schema: <code>{`{ problem, category, priority, department }`}</code></span>
          <span className="text-civic-700 font-medium">Real-time Gemini Model</span>
        </div>

      </div>

    </div>
  );
}
