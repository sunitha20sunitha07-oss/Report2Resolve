import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Calendar,
  Layers,
  Database,
  UserCheck,
  RotateCcw,
  Camera,
  MapPin,
  ExternalLink,
  Navigation,
  Image as ImageIcon,
  Loader2,
  X,
  Maximize2,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { 
  getComplaintById, 
  getAllComplaints, 
  COMPLAINT_STATUSES,
  ComplaintError,
  verifyComplaintResolution,
  updateComplaintStatus,
  attachComplaintEvidence,
  attachResolutionPhoto
} from '../services/complaintService';
import { compressImage } from '../services/imageUtils';
import { getCurrentLocation, formatCoordinates, getMapUrl } from '../services/locationUtils';

export default function TrackComplaint({ initialId = '', onNavigateToReport }) {
  const [searchId, setSearchId] = useState(initialId);
  const [complaint, setComplaint] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null); // { code, message }
  const [copied, setCopied] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [verificationFeedback, setVerificationFeedback] = useState(null); // { type, title, message }

  // Phase 5: Tracking view evidence actions
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationActionError, setLocationActionError] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoActionError, setPhotoActionError] = useState(null);
  const [isProcessingResolutionPhoto, setIsProcessingResolutionPhoto] = useState(false);
  const [resolutionPhotoError, setResolutionPhotoError] = useState(null);
  const [modalImage, setModalImage] = useState(null); // { url, title }

  const citizenPhotoInputRef = useRef(null);
  const resolutionPhotoInputRef = useRef(null);

  // Refresh recent complaints list
  const refreshRecent = () => {
    try {
      const all = getAllComplaints();
      setRecentComplaints(all.slice(0, 5));
    } catch (err) {
      console.warn('Could not load recent complaints:', err.message);
      setRecentComplaints([]);
    }
  };

  useEffect(() => {
    refreshRecent();

    if (initialId && initialId.trim()) {
      setSearchId(initialId.trim());
      handleSearch(initialId.trim());
    }
  }, [initialId]);

  const handleSearch = (idToSearch) => {
    const rawId = idToSearch !== undefined ? idToSearch : searchId;
    const targetId = (rawId || '').trim();
    
    setHasSearched(true);
    setCopied(false);
    setErrorInfo(null);
    setVerificationFeedback(null);
    setLocationActionError(null);
    setPhotoActionError(null);
    setResolutionPhotoError(null);

    // 1. Error handling: empty complaint ID
    if (!targetId) {
      setErrorInfo({
        code: 'EMPTY_ID',
        title: 'Complaint ID Required',
        message: 'Please enter a valid Complaint ID (e.g. R2R-20260929-001) to track its status.'
      });
      setComplaint(null);
      return;
    }

    try {
      const found = getComplaintById(targetId);
      setComplaint(found);
      setErrorInfo(null);
      refreshRecent();
    } catch (err) {
      setComplaint(null);
      
      if (err instanceof ComplaintError) {
        if (err.code === 'EMPTY_ID') {
          setErrorInfo({
            code: 'EMPTY_ID',
            title: 'Empty Complaint ID',
            message: err.message
          });
        } else if (err.code === 'NOT_FOUND') {
          setErrorInfo({
            code: 'NOT_FOUND',
            title: 'Complaint Not Found',
            message: `No record found with ID "${targetId}". Please verify the ID or submit a new grievance.`
          });
        } else if (err.code === 'INVALID_STORED_DATA') {
          setErrorInfo({
            code: 'INVALID_STORED_DATA',
            title: 'Corrupted Stored Data',
            message: err.message || 'The stored record for this complaint is invalid or corrupted.'
          });
        } else if (err.code === 'STORAGE_ERROR') {
          setErrorInfo({
            code: 'STORAGE_ERROR',
            title: 'Local Storage Error',
            message: err.message || 'Unable to access local browser storage. Storage may be disabled or full.'
          });
        } else {
          setErrorInfo({
            code: err.code || 'UNKNOWN',
            title: 'Search Error',
            message: err.message
          });
        }
      } else {
        setErrorInfo({
          code: 'GENERIC_ERROR',
          title: 'Unexpected Error',
          message: err?.message || 'An unexpected error occurred while searching for the complaint.'
        });
      }
    }
  };

  /**
   * Phase 4: Handle Citizen Resolution Verification
   * @param {boolean} isResolved - true if confirmed, false if reopened
   */
  const handleCitizenVerify = (isResolved) => {
    if (!complaint?.id) return;
    try {
      const updated = verifyComplaintResolution(complaint.id, isResolved);
      setComplaint(updated);
      refreshRecent();

      if (isResolved) {
        setVerificationFeedback({
          type: 'confirmed',
          title: 'Resolution Confirmed',
          message: 'Thank you for confirming! You have verified that this civic problem has been successfully resolved to your satisfaction.'
        });
      } else {
        setVerificationFeedback({
          type: 'reopened',
          title: 'Complaint Reopened',
          message: 'The complaint has been reopened and set back to "In Progress". It has been sent back for action to the designated municipal department.'
        });
      }
    } catch (err) {
      console.error('Failed to verify resolution:', err);
      setErrorInfo({
        code: 'VERIFY_ERROR',
        title: 'Verification Failed',
        message: err?.message || 'Failed to update verification status in local storage.'
      });
    }
  };

  /**
   * Phase 5: Citizen attaches photo proof while tracking
   */
  const handleAttachCitizenPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !complaint?.id) return;

    setPhotoActionError(null);
    setIsProcessingPhoto(true);

    try {
      const compressed = await compressImage(file, 800, 800, 0.7);
      const updated = attachComplaintEvidence(complaint.id, { photoProof: compressed });
      setComplaint(updated);
      refreshRecent();
    } catch (err) {
      console.error('Failed to attach photo proof:', err);
      setPhotoActionError(err.message || 'Failed to attach image proof.');
    } finally {
      setIsProcessingPhoto(false);
      if (citizenPhotoInputRef.current) citizenPhotoInputRef.current.value = '';
    }
  };

  /**
   * Phase 5: Citizen captures location proof while tracking
   */
  const handleCaptureTrackingLocation = async () => {
    if (!complaint?.id) return;
    setIsCapturingLocation(true);
    setLocationActionError(null);

    try {
      const coords = await getCurrentLocation();
      const updated = attachComplaintEvidence(complaint.id, { locationProof: coords });
      setComplaint(updated);
      refreshRecent();
    } catch (err) {
      console.warn('Geolocation capture failed in tracking:', err);
      setLocationActionError(err.message || 'Failed to capture GPS location.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  /**
   * Phase 5: Officer / Resolution attaches after-photo proof
   */
  const handleAttachResolutionPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !complaint?.id) return;

    setResolutionPhotoError(null);
    setIsProcessingResolutionPhoto(true);

    try {
      const compressed = await compressImage(file, 800, 800, 0.7);
      const updated = attachResolutionPhoto(complaint.id, compressed);
      setComplaint(updated);
      refreshRecent();
    } catch (err) {
      console.error('Failed to attach resolution photo:', err);
      setResolutionPhotoError(err.message || 'Failed to attach resolution photo proof.');
    } finally {
      setIsProcessingResolutionPhoto(false);
      if (resolutionPhotoInputRef.current) resolutionPhotoInputRef.current.value = '';
    }
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

  // 4-stage Timeline helper:
  const getTimelineStepStatus = (stepName, currentStatus) => {
    const currentIndex = COMPLAINT_STATUSES.indexOf(currentStatus || 'Received');
    const stepIndex = COMPLAINT_STATUSES.indexOf(stepName);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) {
      if (stepName === 'Resolved' && complaint?.citizenVerified) {
        return 'completed';
      }
      return 'current';
    }
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-civic-100 text-civic-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real-time Civic Resolution Tracking</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Complaint
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Enter your unique Complaint ID (<code>R2R-YYYYMMDD-XXX</code>) to view the 4-stage resolution timeline, verified municipal dispatch, and photo/location evidence.
        </p>
      </div>

      {/* Tracking Search Input Card */}
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
              onChange={(e) => {
                setSearchId(e.target.value.toUpperCase());
                if (errorInfo) setErrorInfo(null);
                if (verificationFeedback) setVerificationFeedback(null);
              }}
              placeholder="e.g. R2R-20260929-001"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 font-mono text-sm sm:text-base uppercase tracking-wider focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm sm:text-base shadow-md shadow-civic-600/25 transition-all cursor-pointer"
          >
            <span>Track Complaint</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick selection chips for complaints saved in this browser */}
        {recentComplaints.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              Stored in this browser:
            </span>
            {recentComplaints.map(rc => (
              <button
                key={rc.id}
                type="button"
                onClick={() => {
                  setSearchId(rc.id);
                  handleSearch(rc.id);
                }}
                className={`text-xs font-mono font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
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

      {/* Comprehensive Error Handling Feedback */}
      {errorInfo && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3.5 animate-fadeIn">
          {errorInfo.code === 'STORAGE_ERROR' ? (
            <Database className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-bold text-rose-950">{errorInfo.title}</h4>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              {errorInfo.message}
            </p>

            {errorInfo.code === 'NOT_FOUND' && onNavigateToReport && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Report a Problem Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Banner after Verification Action */}
      {verificationFeedback && (
        <div className={`p-5 rounded-2xl border flex items-start gap-3.5 animate-fadeIn ${
          verificationFeedback.type === 'confirmed'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          {verificationFeedback.type === 'confirmed' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="text-sm font-bold">
              {verificationFeedback.title}
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed">
              {verificationFeedback.message}
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
              <span className="text-xs text-civic-300 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-civic-400" />
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
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <div className="flex items-center gap-2">
                {complaint.isEmergency && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>EMERGENCY</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-civic-500/20 text-civic-300 border border-civic-400/30">
                  <span className={`w-2 h-2 rounded-full ${
                    complaint.isEmergency
                      ? 'bg-rose-400 animate-pulse'
                      : complaint.status === 'Resolved' && complaint.citizenVerified
                        ? 'bg-emerald-400'
                        : complaint.status === 'Resolved'
                          ? 'bg-amber-400 animate-pulse'
                          : complaint.status === 'In Progress' && complaint.citizenVerified === false
                            ? 'bg-amber-500'
                            : 'bg-emerald-400'
                  }`} />
                  Status: {complaint.status}
                  {complaint.status === 'Resolved' && complaint.citizenVerified && ' • Confirmed'}
                  {complaint.status === 'In Progress' && complaint.citizenVerified === false && ' • Reopened'}
                </span>
              </div>

              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Filed: {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            
            {/* PHASE 6: Emergency Active Callout Banner */}
            {complaint.isEmergency && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-2 border-rose-500 text-rose-950 space-y-2 shadow-xs animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-rose-600 text-white">
                          EMERGENCY COMPLAINT
                        </span>
                        <h4 className="text-sm font-extrabold text-rose-950">
                          {complaint.emergencyType || 'Urgent Civic Safety Hazard'}
                        </h4>
                      </div>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Classified as high-urgency public emergency requiring expedited municipal dispatch
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                    <span>Expedited Routing Active</span>
                  </span>
                </div>

                {complaint.emergencyReason && (
                  <div className="p-3 rounded-xl bg-white/90 border border-rose-200 text-xs text-rose-900 mt-2">
                    <strong className="text-slate-900">Emergency Assessment:</strong> {complaint.emergencyReason}
                  </div>
                )}
              </div>
            )}
            
            {/* 4-Stage Status Timeline: Received -> Assigned -> In Progress -> Resolved */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    4-Stage Resolution Timeline
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Grievance lifecycle tracking from registration to verified resolution
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-civic-50 text-civic-700 border border-civic-200">
                  Active Stage: <strong>{complaint.status}</strong>
                  {complaint.status === 'Resolved' && complaint.citizenVerified && ' (Verified)'}
                </span>
              </div>

              {/* Visual Stepper */}
              <div className="relative pt-4 pb-2">
                
                {/* Connecting Line (desktop) */}
                <div className="absolute top-8 left-8 right-8 h-1 bg-slate-200 -z-0 hidden sm:block" />

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
                  {COMPLAINT_STATUSES.map((step, idx) => {
                    const statusState = getTimelineStepStatus(step, complaint.status);
                    const isCurrent = statusState === 'current';
                    const isCompleted = statusState === 'completed';

                    return (
                      <div 
                        key={step} 
                        className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 sm:p-0 rounded-xl sm:rounded-none transition-all ${
                          isCurrent 
                            ? 'bg-civic-50/80 sm:bg-transparent border sm:border-0 border-civic-200' 
                            : ''
                        }`}
                      >
                        
                        {/* Step Circle Indicator */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          isCurrent
                            ? 'bg-civic-700 text-white ring-4 ring-civic-100 shadow-md scale-105'
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

                        {/* Step Label & Description */}
                        <div className="text-left sm:text-center">
                          <p className={`text-sm font-bold ${
                            isCurrent 
                              ? 'text-civic-900' 
                              : isCompleted 
                                ? 'text-slate-800' 
                                : 'text-slate-400'
                          }`}>
                            {step}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {step === 'Received' && 'Grievance recorded & logged'}
                            {step === 'Assigned' && 'Municipal desk dispatch'}
                            {step === 'In Progress' && 'Field inspection & repair'}
                            {step === 'Resolved' && (complaint.citizenVerified ? 'Citizen Verified' : 'Awaiting Citizen Sign-off')}
                          </p>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
              
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Notice:</span> Grievance statuses reflect municipal workflow records. Only when the status reaches <strong>Resolved</strong> is the citizen requested to verify the on-site resolution.
              </div>
            </div>

            {/* PHASE 5: Visual Evidence Section (Citizen Evidence vs Resolution Evidence) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-civic-600" />
                    <span>Evidence & Verification Dossier</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Photo proof and geolocation verified records for on-ground municipal accountability
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    complaint.photoProof
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Camera className="w-3 h-3" />
                    <span>Photo Proof: {complaint.photoProof ? 'Attached' : 'Not Attached'}</span>
                  </span>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    complaint.locationProof
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <MapPin className="w-3 h-3" />
                    <span>Location Proof: {complaint.locationProof ? 'Captured' : 'Not Captured'}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. CITIZEN EVIDENCE CARD (Before Photo + Location Proof) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900">Citizen Evidence</h5>
                        <p className="text-[11px] text-slate-500">Problem spot documentation at time of reporting</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Before Photo
                    </span>
                  </div>

                  {/* Photo Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-civic-600" />
                        <span>Problem Photo:</span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {complaint.photoProof ? 'Verified' : 'Pending'}
                      </span>
                    </span>

                    {complaint.photoProof ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-48 flex items-center justify-center">
                        <img 
                          src={complaint.photoProof} 
                          alt="Citizen Reported Evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setModalImage({ url: complaint.photoProof, title: `Citizen Evidence • ${complaint.id}` })}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity cursor-pointer"
                        >
                          <Maximize2 className="w-4 h-4" />
                          <span>View Full Photo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-2">
                        <p className="text-xs text-slate-500">No citizen photo proof was attached at filing.</p>
                        <input
                          type="file"
                          ref={citizenPhotoInputRef}
                          accept="image/*"
                          capture="environment"
                          onChange={handleAttachCitizenPhoto}
                          className="hidden"
                          id="track-attach-photo"
                        />
                        <label
                          htmlFor="track-attach-photo"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-civic-500 text-xs font-semibold text-slate-700 hover:text-civic-700 transition-all cursor-pointer shadow-2xs"
                        >
                          {isProcessingPhoto ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-civic-600" />
                              <span>Compressing photo...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3.5 h-3.5 text-civic-600" />
                              <span>Attach Photo Proof</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {photoActionError && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{photoActionError}</span>
                      </p>
                    )}
                  </div>

                  {/* Location Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        <span>GPS Location Proof:</span>
                      </span>
                      <span className={`text-[11px] font-bold ${complaint.locationProof ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {complaint.locationProof ? 'Captured' : 'Not Captured'}
                      </span>
                    </span>

                    {complaint.locationProof ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                          <span>{formatCoordinates(complaint.locationProof.latitude, complaint.locationProof.longitude)}</span>
                          <a
                            href={getMapUrl(complaint.locationProof.latitude, complaint.locationProof.longitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-civic-700 hover:underline font-semibold"
                          >
                            <span>Open Map</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Accuracy: ±{complaint.locationProof.accuracy || 'N/A'}m</span>
                          <span>{new Date(complaint.locationProof.capturedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-2">
                        <p className="text-xs text-slate-500">No GPS coordinates recorded for this ticket.</p>
                        <button
                          type="button"
                          onClick={handleCaptureTrackingLocation}
                          disabled={isCapturingLocation}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
                        >
                          {isCapturingLocation ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-civic-600" />
                              <span>Locating GPS...</span>
                            </>
                          ) : (
                            <>
                              <Navigation className="w-3.5 h-3.5 text-rose-600" />
                              <span>Capture Location</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {locationActionError && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{locationActionError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. RESOLUTION EVIDENCE CARD (After Photo Proof) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900">Resolution Evidence</h5>
                        <p className="text-[11px] text-slate-500">Field crew on-site verification & repair photo</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      After Photo
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Repair / Closure Photo:</span>
                      </span>
                      <span className={`text-[11px] font-bold ${complaint.resolutionPhoto ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {complaint.resolutionPhoto ? 'Verified On-site' : 'Optional / Pending'}
                      </span>
                    </span>

                    {complaint.resolutionPhoto ? (
                      <div className="space-y-2">
                        <div className="relative group rounded-xl overflow-hidden border border-emerald-200 bg-slate-100 h-48 flex items-center justify-center">
                          <img 
                            src={complaint.resolutionPhoto} 
                            alt="Resolution Evidence Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setModalImage({ url: complaint.resolutionPhoto, title: `Resolution Evidence • ${complaint.id}` })}
                            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity cursor-pointer"
                          >
                            <Maximize2 className="w-4 h-4" />
                            <span>View Full Photo</span>
                          </button>
                        </div>
                        {complaint.resolutionCapturedAt && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Attached on {new Date(complaint.resolutionCapturedAt).toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-2 h-48 flex flex-col items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600 font-medium">
                            {complaint.status === 'Resolved' 
                              ? 'Attach after-photo showing completed on-site repair'
                              : 'Resolution photo will appear once field crew completes repair'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Demonstrates verified physical resolution
                          </p>
                        </div>

                        {complaint.status === 'Resolved' && (
                          <div className="pt-1">
                            <input
                              type="file"
                              ref={resolutionPhotoInputRef}
                              accept="image/*"
                              capture="environment"
                              onChange={handleAttachResolutionPhoto}
                              className="hidden"
                              id="track-attach-resolution-photo"
                            />
                            <label
                              htmlFor="track-attach-resolution-photo"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                            >
                              {isProcessingResolutionPhoto ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Compressing...</span>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Upload Resolution Photo</span>
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {resolutionPhotoError && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{resolutionPhotoError}</span>
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* PHASE 4: Citizen Resolution Verification Section */}
            {complaint.status === 'Resolved' && (
              <div className="space-y-4 pt-2">
                {complaint.citizenVerified ? (
                  /* Case 3: Citizen Verified Yes -> Resolution Confirmed */
                  <div className="p-6 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-3 shadow-xs animate-fadeIn">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-emerald-950">Resolution Confirmed</h4>
                          <p className="text-xs text-emerald-700">Citizen verified the physical fix on-site</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Certified Closed</span>
                      </span>
                    </div>

                    <p className="text-sm text-emerald-900 leading-relaxed">
                      Thank you for confirming! You have verified that this civic grievance was resolved to your satisfaction. The municipal ticket is now permanently closed and archived with citizen sign-off.
                    </p>

                    {complaint.verifiedAt && (
                      <p className="text-xs text-emerald-700 pt-1 border-t border-emerald-200/60 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Verified on {new Date(complaint.verifiedAt).toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  /* Case 2: Status is Resolved but not yet verified -> Was your problem resolved? */
                  <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border-2 border-amber-300 shadow-sm space-y-5 animate-fadeIn">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Phase 4 • Citizen Resolution Verification</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Was your problem resolved?
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                        Municipal authorities have completed work and marked this complaint as <strong>Resolved</strong>. Please inspect the site and any attached evidence above to confirm whether the problem has actually been fixed to your satisfaction.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCitizenVerify(true)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Yes, Problem Resolved</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCitizenVerify(false)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 hover:shadow-rose-600/30 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>No, Problem Not Resolved</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reopened Banner if Complaint was reopened back to In Progress */}
            {complaint.status === 'In Progress' && complaint.citizenVerified === false && complaint.reopenedAt && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                      Complaint Reopened
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200/70 text-amber-900">
                    Action Resumed
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  You indicated that the problem was not resolved. This complaint has been reopened and set back to <strong>In Progress</strong>. It has been sent back for action to the designated municipal department.
                </p>
                <p className="text-[11px] text-amber-700">
                  Reopened on {new Date(complaint.reopenedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Stored Complaint Particulars */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Complaint Details
              </h4>

              {/* 1. Original Citizen Complaint */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Original Complaint (Citizen Input):
                </span>
                <p className="text-sm font-medium text-slate-800 italic font-sans leading-relaxed">
                  "{complaint.originalComplaint}"
                </p>
              </div>

              {/* 2. Structured Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* AI-Generated Problem Summary */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Info className="w-4 h-4 text-civic-600" />
                    <span>AI-Generated Problem</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {complaint.problem}
                  </p>
                </div>

                {/* Category */}
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

                {/* Priority */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Assessed Priority</span>
                  </div>
                  <div>
                    {complaint.isEmergency ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        <span>EMERGENCY (Critical)</span>
                      </span>
                    ) : (() => {
                      const pStyle = getPriorityStyle(complaint.priority);
                      const PIcon = pStyle.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${pStyle.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${pStyle.dot}`} />
                          <PIcon className="w-3.5 h-3.5" />
                          <span>Standard Priority ({complaint.priority})</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Designated Department */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Designated Department</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{complaint.department}</span>
                  </p>
                </div>

              </div>

              {/* Status, Verification, Emergency Type, and CreatedAt metadata */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <span>Complaint ID: <strong className="font-mono text-slate-700">{complaint.id}</strong></span>
                <span>Current Status: <strong className="text-slate-800">{complaint.status}</strong></span>
                <span>Complaint Type: <strong className={complaint.isEmergency ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                  {complaint.isEmergency ? `Emergency (${complaint.emergencyType || 'Hazard'})` : 'Standard Priority'}
                </strong></span>
                {complaint.citizenVerified !== undefined && (
                  <span>Citizen Verified: <strong className={complaint.citizenVerified ? 'text-emerald-700' : 'text-amber-700'}>
                    {complaint.citizenVerified ? 'Yes (Confirmed)' : 'No (Reopened)'}
                  </strong></span>
                )}
                <span>Created: <strong className="text-slate-700">{complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}</strong></span>
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
              When you file an issue through Report2Resolve, a tracking ID formatted as <code>R2R-YYYYMMDD-XXX</code> is generated. Enter it above to view its 4-stage resolution status.
            </p>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {modalImage && (
        <div 
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl space-y-0"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-sm font-bold truncate">{modalImage.title}</span>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img 
                src={modalImage.url} 
                alt="Enlarged Evidence View" 
                className="max-h-[70vh] w-auto max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
