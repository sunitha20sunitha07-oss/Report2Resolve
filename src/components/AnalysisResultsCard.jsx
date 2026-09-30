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
  Clock, 
  FileCheck2, 
  ArrowRight,
  Send,
  Camera,
  MapPin,
  ShieldAlert,
  Zap
} from 'lucide-react';

export default function AnalysisResultsCard({ 
  result, 
  isLoading, 
  loadingStatus, 
  error, 
  onRetry,
  onCreateComplaint,
  createdComplaint,
  onViewTrack,
  onOpenApiKeyModal
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
                Parsing language nuances, assessing civic severity, and determining responsible department...
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

              {onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-civic-600" />
                  <span>Configure Gemini Key</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Empty / Initial State */}
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
          <div className="space-y-5">
            
            {/* Top Analysis Status Banner */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Grievance successfully analyzed by Gemini 3.8 Flash</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800">Status: Verified</span>
            </div>

            {/* PHASE 6: Emergency Detection Alert Banner */}
            {result.isEmergency ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border-2 border-rose-500 shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 animate-pulse shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white tracking-wider uppercase animate-pulse">
                          EMERGENCY
                        </span>
                        <h4 className="text-base font-extrabold text-rose-950">
                          Emergency Complaint Detected
                        </h4>
                      </div>
                      <p className="text-xs font-bold text-rose-700 mt-0.5">
                        High-urgency public hazard requiring immediate priority dispatch
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                    <span>Expedited Dispatch</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/90 border border-rose-200 space-y-1.5 text-xs text-rose-900">
                  <div className="flex items-baseline gap-2">
                    <strong className="text-slate-900 shrink-0 uppercase tracking-wider text-[11px]">Emergency Type:</strong>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {result.emergencyType || 'Civic Emergency Hazard'}
                    </span>
                  </div>
                  {result.emergencyReason && (
                    <div className="pt-1 flex items-baseline gap-2">
                      <strong className="text-slate-900 shrink-0 uppercase tracking-wider text-[11px]">Reason:</strong>
                      <span className="text-slate-700 leading-relaxed font-medium">
                        {result.emergencyReason}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-rose-800 leading-relaxed">
                  <strong>Notice:</strong> This ticket receives expedited municipal routing. In severe, active life-or-death emergencies, citizens should also notify local emergency telephone helplines directly. No automated phone calls are initiated by this portal.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wider">
                    Standard Priority
                  </span>
                  <span className="text-slate-700 font-medium">
                    Routine Civic Grievance • Standard departmental resolution procedure
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Evaluated: Non-Emergency
                </span>
              </div>
            )}

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
                  {result.isEmergency ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <Flame className="w-3.5 h-3.5 text-rose-600" />
                      <span>EMERGENCY (Critical Priority)</span>
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${priorityMeta.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${priorityMeta.dot}`} />
                      <span>Standard Priority ({result.priority})</span>
                    </span>
                  )}
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

            {/* Registration action section */}
            {!createdComplaint && onCreateComplaint && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-900">Ready to officially file this grievance?</p>
                  <p className="text-xs text-slate-600">
                    Generates a unique tracking ID (<code>R2R-YYYYMMDD-XXX</code>) with initial status <strong>Received</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCreateComplaint}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Create Complaint</span>
                </button>
              </div>
            )}

            {/* Registered success card */}
            {createdComplaint && (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Complaint Created Successfully</h4>
                      <p className="text-xs text-emerald-800">
                        Tracking ID: <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200">{createdComplaint.id}</span>
                        <span className="ml-2 inline-flex items-center gap-1 font-semibold text-emerald-700">
                          (Status: {createdComplaint.status})
                        </span>
                      </p>
                    </div>
                  </div>

                  {onViewTrack && (
                    <button
                      type="button"
                      onClick={() => onViewTrack(createdComplaint.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Track Complaint</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Phase 5 Evidence Badges & Phase 6 Emergency Status */}
                <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-2 text-xs">
                  {createdComplaint.isEmergency && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold bg-rose-600 text-white shadow-2xs animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>EMERGENCY DISPATCH</span>
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold ${
                    createdComplaint.photoProof
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    <Camera className="w-3 h-3" />
                    <span>Photo Proof: {createdComplaint.photoProof ? 'Attached' : 'Not Attached'}</span>
                  </span>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold ${
                    createdComplaint.locationProof
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    <MapPin className="w-3 h-3" />
                    <span>Location Proof: {createdComplaint.locationProof ? 'Captured' : 'Not Captured'}</span>
                  </span>
                </div>
              </div>
            )}

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
          <span className="text-civic-700 font-medium">Server-side Gemini 3.8 Flash</span>
        </div>

      </div>

    </div>
  );
}
