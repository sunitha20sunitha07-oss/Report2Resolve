import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Tag, 
  AlertTriangle, 
  Flame, 
  Info, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  History,
  FileText
} from 'lucide-react';
import { getComplaintById, getAllComplaints, COMPLAINT_STATUSES } from '../services/complaintService';

export default function TrackComplaint({ initialId = '', onNavigateToReport }) {
  const [searchId, setSearchId] = useState(initialId);
  const [complaint, setComplaint] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState([]);

  useEffect(() => {
    // Load recent complaints for quick tracking
    const all = getAllComplaints();
    setRecentComplaints(all.slice(0, 5));

    if (initialId && initialId.trim()) {
      handleSearch(initialId.trim());
    }
  }, [initialId]);

  const handleSearch = (idToSearch) => {
    const targetId = (idToSearch || searchId).trim();
    setHasSearched(true);
    setCopied(false);

    if (!targetId) {
      setErrorMsg('Please enter a Complaint ID to track.');
      setComplaint(null);
      return;
    }

    const found = getComplaintById(targetId);
    if (!found) {
      setErrorMsg(`No complaint found with ID "${targetId}". Please verify the ID.`);
      setComplaint(null);
      return;
    }

    setErrorMsg('');
    setComplaint(found);
  };

  const handleCopyId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper for priority badges
  const getPriorityStyle = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'critical':
        return { bg: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-600', icon: Flame };
      case 'high':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500', icon: AlertTriangle };
      case 'medium':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-600', icon: Clock };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-500', icon: Info };
    }
  };

  // Timeline helper
  const getTimelineStepStatus = (stepName, currentStatus) => {
    const currentIndex = COMPLAINT_STATUSES.indexOf(currentStatus || 'Received');
    const stepIndex = COMPLAINT_STATUSES.indexOf(stepName);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-civic-100 text-civic-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real-time Public Resolution Tracking</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Grievance
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Enter your unique Complaint ID to monitor real-time department routing, municipal action, and resolution progress.
        </p>
      </div>

      {/* Tracking Search Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchId);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="Enter Complaint ID (e.g. R2R-20260928-001)"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 font-mono text-sm sm:text-base uppercase tracking-wider focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm sm:text-base shadow-md shadow-civic-600/25 transition-all"
          >
            <span>Track Complaint</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick selection chips for recently filed complaints */}
        {recentComplaints.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              Recent in this browser:
            </span>
            {recentComplaints.map(rc => (
              <button
                key={rc.id}
                type="button"
                onClick={() => {
                  setSearchId(rc.id);
                  handleSearch(rc.id);
                }}
                className={`text-xs font-mono font-medium px-2.5 py-1 rounded-lg border transition-all ${
                  complaint?.id === rc.id
                    ? 'bg-civic-50 text-civic-700 border-civic-300 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {rc.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{errorMsg}</p>
            <p className="text-xs text-rose-700">
              Please double check the ID format (e.g. <code>R2R-20260928-001</code>). If you haven't filed a complaint yet, click "Report a Problem" to register your issue.
            </p>
          </div>
        </div>
      )}

      {/* Complaint Tracking Result Card */}
      {complaint && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
          
          {/* Card Top Banner */}
          <div className="bg-slate-900 text-white px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-civic-300 font-semibold tracking-wider uppercase">
                Official Grievance Record
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white">
                  {complaint.id}
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopyId(complaint.id)}
                  title="Copy Complaint ID"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-civic-500/20 text-civic-300 border border-civic-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Status: {complaint.status}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Filed on {new Date(complaint.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Status Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Resolution Progress Timeline
                </h4>
                <span className="text-xs font-medium text-civic-600">
                  Stage: {complaint.status}
                </span>
              </div>

              {/* Visual Stepper */}
              <div className="relative pt-4 pb-2">
                
                {/* Connecting Line */}
                <div className="absolute top-8 left-6 right-6 h-1 bg-slate-200 -z-0 hidden sm:block" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                  {COMPLAINT_STATUSES.map((step, idx) => {
                    const statusState = getTimelineStepStatus(step, complaint.status);
                    const isCurrent = statusState === 'current';
                    const isCompleted = statusState === 'completed';

                    return (
                      <div key={step} className="flex flex-col sm:items-center text-left sm:text-center space-y-2">
                        
                        {/* Step Circle Indicator */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                          isCurrent
                            ? 'bg-civic-600 text-white ring-4 ring-civic-100 shadow-sm scale-110'
                            : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Details */}
                        <div>
                          <p className={`text-sm font-bold ${
                            isCurrent ? 'text-civic-800' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {step}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {step === 'Received' && 'Grievance registered'}
                            {step === 'Assigned' && 'Dispatched to field officer'}
                            {step === 'In Progress' && 'On-site repair active'}
                            {step === 'Resolved' && 'Pending citizen verify'}
                          </p>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Structured Complaint Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Grievance Particulars
              </h4>

              {/* Original Complaint Quote */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Original Citizen Complaint:
                </span>
                <p className="text-sm font-medium text-slate-800 italic font-sans leading-relaxed">
                  "{complaint.originalComplaint}"
                </p>
              </div>

              {/* 4 Metadata Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Problem */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Info className="w-4 h-4 text-civic-600" />
                    <span>Problem Description</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {complaint.problem}
                  </p>
                </div>

                {/* 2. Category */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>Category</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {complaint.category}
                    </span>
                  </div>
                </div>

                {/* 3. Priority */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Assessed Urgency</span>
                  </div>
                  <div>
                    {(() => {
                      const pStyle = getPriorityStyle(complaint.priority);
                      const PIcon = pStyle.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${pStyle.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${pStyle.dot}`} />
                          <PIcon className="w-3.5 h-3.5" />
                          <span>{complaint.priority} Priority</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* 4. Department */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Designated Authority</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{complaint.department}</span>
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Initial Empty State before any search */}
      {!hasSearched && !complaint && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Enter Your Complaint ID Above
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              When you file an issue through Report2Resolve, a tracking ID formatted as <code>R2R-YYYYMMDD-XXX</code> is provided. Enter it to view live progress.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
