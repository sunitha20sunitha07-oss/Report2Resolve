import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  Languages, 
  AlertCircle,
  Loader2,
  Camera,
  MapPin,
  CheckCircle2,
  X,
  Navigation,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import AnalysisResultsCard from './AnalysisResultsCard';
import { analyzeComplaintWithGemini } from '../services/aiService';
import { createComplaint } from '../services/complaintService';
import { compressImage } from '../services/imageUtils';
import { getCurrentLocation, formatCoordinates, getMapUrl } from '../services/locationUtils';

export default function ComplaintForm({ onNavigateToTrack, onOpenApiKeyModal }) {
  const [complaintText, setComplaintText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [createdComplaint, setCreatedComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Analyzing complaint...');
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Phase 5: Photo + Location Proof States
  const [photoProof, setPhotoProof] = useState(null);
  const [locationProof, setLocationProof] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const fileInputRef = useRef(null);

  const TAMIL_EXAMPLE = "எங்க தெருவுல மூணு நாளா street light எரியல.";

  const handleUseExample = () => {
    setComplaintText(TAMIL_EXAMPLE);
    setValidationError('');
    setError(null);
    setCreatedComplaint(null);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setIsCompressingPhoto(true);

    try {
      // Safe client-side compression to avoid exceeding localStorage quota
      const compressedDataUrl = await compressImage(file, 800, 800, 0.7);
      setPhotoProof(compressedDataUrl);
    } catch (err) {
      console.error('Photo processing failed:', err);
      setPhotoError(err.message || 'Failed to process selected image.');
    } finally {
      setIsCompressingPhoto(false);
      // Reset input value so same file can be re-selected if removed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoProof(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCaptureLocation = async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const coords = await getCurrentLocation();
      setLocationProof(coords);
    } catch (err) {
      console.warn('Geolocation capture failed:', err);
      setLocationError(err.message || 'Could not capture GPS location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleRemoveLocation = () => {
    setLocationProof(null);
    setLocationError(null);
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
    setCreatedComplaint(null);
    setIsLoading(true);
    setLoadingStatus('Analyzing grievance with Google Gemini AI...');

    try {
      const result = await analyzeComplaintWithGemini(trimmed, '', (status) => {
        setLoadingStatus(status);
      });
      setAnalysisResult(result);
      setError(null);
    } catch (err) {
      console.error('Complaint analysis failed:', err);
      if (err.needsApiKey && onOpenApiKeyModal) {
        onOpenApiKeyModal();
      }
      setError(err.message || 'Failed to analyze complaint with Gemini AI.');
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
      setLoadingStatus('Analyzing complaint...');
    }
  };

  const handleCreateComplaint = () => {
    if (!analysisResult) return;
    try {
      const saved = createComplaint({
        originalComplaint: complaintText,
        problem: analysisResult.problem,
        category: analysisResult.category,
        priority: analysisResult.priority,
        department: analysisResult.department,
        photoProof,
        locationProof,
        isEmergency: analysisResult.isEmergency,
        emergencyType: analysisResult.emergencyType,
        emergencyReason: analysisResult.emergencyReason
      });
      setCreatedComplaint(saved);
      setError(null);
    } catch (err) {
      console.error('Failed to create complaint:', err);
      setError(err?.message || 'Failed to save complaint record to local storage.');
    }
  };

  const handleClear = () => {
    setComplaintText('');
    setAnalysisResult(null);
    setCreatedComplaint(null);
    setError(null);
    setValidationError('');
    setPhotoProof(null);
    setLocationProof(null);
    setLocationError(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            Insert Example
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAnalyze} className="space-y-5">
          
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

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  title="Voice Input (Placeholder - Will be enabled in future phase)"
                  className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-medium cursor-not-allowed transition-all"
                >
                  <Mic className="w-4 h-4 text-slate-500 group-hover:text-civic-600" />
                  <span className="hidden sm:inline">Voice Input</span>
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

          {/* PHASE 5: Photo + Location Proof Section */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-civic-100 text-civic-700 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Evidence & Verification Proof (Optional)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Helps municipal officers verify and inspect on-site
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. Photo Proof */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-civic-600" />
                    <span>Photo Proof:</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    photoProof 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {photoProof ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Attached</span>
                      </>
                    ) : (
                      <span>Not Attached</span>
                    )}
                  </span>
                </div>

                {photoProof ? (
                  <div className="space-y-2">
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center">
                      <img 
                        src={photoProof} 
                        alt="Citizen Evidence Proof" 
                        className="w-full h-36 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-md transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Photo ready to submit with grievance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Attach or capture a photo showing the damaged street light, road pothole, or civic issue.
                    </p>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="citizen-photo-upload"
                    />
                    <label
                      htmlFor="citizen-photo-upload"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-civic-500 bg-slate-50 hover:bg-civic-50/50 text-slate-700 hover:text-civic-700 text-xs font-semibold cursor-pointer transition-all"
                    >
                      {isCompressingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-civic-600" />
                          <span>Processing photo...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-civic-600" />
                          <span>Capture / Select Photo</span>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {photoError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{photoError}</span>
                  </p>
                )}
              </div>

              {/* 2. Location Proof */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Location Proof:</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    locationProof 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {locationProof ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Captured</span>
                      </>
                    ) : (
                      <span>Not Captured</span>
                    )}
                  </span>
                </div>

                {locationProof ? (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-mono font-semibold">
                        <span>GPS: {formatCoordinates(locationProof.latitude, locationProof.longitude)}</span>
                        <button
                          type="button"
                          onClick={handleRemoveLocation}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          title="Remove location"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-emerald-800">
                        <span>Accuracy: ±{locationProof.accuracy || 'N/A'}m</span>
                        <a 
                          href={getMapUrl(locationProof.latitude, locationProof.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-civic-700 hover:underline font-semibold"
                        >
                          <span>View Map</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Captured on {new Date(locationProof.capturedAt).toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Capture high-accuracy GPS coordinates so field crews can locate the problem spot instantly.
                    </p>
                    <button
                      type="button"
                      onClick={handleCaptureLocation}
                      disabled={isLocating}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-civic-600" />
                          <span>Acquiring GPS Signal...</span>
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

                {locationError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{locationError}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Supports Tamil, English, and Tanglish input.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {(complaintText || photoProof || locationProof) && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-md shadow-civic-600/25 hover:shadow-civic-600/35 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
        onCreateComplaint={handleCreateComplaint}
        createdComplaint={createdComplaint}
        onViewTrack={(id) => onNavigateToTrack && onNavigateToTrack(id)}
        onOpenApiKeyModal={onOpenApiKeyModal}
      />

    </div>
  );
}
