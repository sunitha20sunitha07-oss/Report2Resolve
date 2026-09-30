/**
 * Report2Resolve - Complaint Persistence & Lifecycle Service
 * 
 * Manages Phase 3: Complaint ID generation, localStorage persistence,
 * and 4-stage resolution tracking with strict error handling.
 */

export const STORAGE_KEY = 'report2resolve_complaints';

export const COMPLAINT_STATUSES = [
  'Received',
  'Assigned',
  'In Progress',
  'Resolved'
];

/**
 * Custom Error for Complaint operations
 */
export class ComplaintError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ComplaintError';
    this.code = code;
  }
}

/**
 * Check if browser localStorage is available and functioning.
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__r2r_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validate that a complaint record has all mandatory fields and valid types.
 * @param {any} item
 * @returns {boolean}
 */
export function isValidComplaint(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return false;
  }

  // 1. ID must be a non-empty string adhering to R2R format
  if (typeof item.id !== 'string' || !item.id.trim() || !item.id.startsWith('R2R-')) {
    return false;
  }

  // 2. Original complaint must be non-empty string
  if (typeof item.originalComplaint !== 'string' || !item.originalComplaint.trim()) {
    return false;
  }

  // 3. AI-generated problem description
  if (typeof item.problem !== 'string' || !item.problem.trim()) {
    return false;
  }

  // 4. Category
  if (typeof item.category !== 'string' || !item.category.trim()) {
    return false;
  }

  // 5. Priority
  if (typeof item.priority !== 'string' || !item.priority.trim()) {
    return false;
  }

  // 6. Department
  if (typeof item.department !== 'string' || !item.department.trim()) {
    return false;
  }

  // 7. Status must be one of the supported 4 stages
  if (typeof item.status !== 'string' || !COMPLAINT_STATUSES.includes(item.status)) {
    return false;
  }

  // 8. createdAt must be a valid ISO date string
  if (typeof item.createdAt !== 'string' || isNaN(Date.parse(item.createdAt))) {
    return false;
  }

  // 9. citizenVerified is optional (must be boolean if present)
  if (item.citizenVerified !== undefined && typeof item.citizenVerified !== 'boolean') {
    return false;
  }

  // 10. Phase 5: photoProof is optional (must be string if present)
  if (item.photoProof !== undefined && item.photoProof !== null && typeof item.photoProof !== 'string') {
    return false;
  }

  // 11. Phase 5: locationProof is optional (must be valid object with lat/lng if present)
  if (item.locationProof !== undefined && item.locationProof !== null) {
    if (typeof item.locationProof !== 'object' || Array.isArray(item.locationProof)) {
      return false;
    }
    if (typeof item.locationProof.latitude !== 'number' || typeof item.locationProof.longitude !== 'number') {
      return false;
    }
  }

  // 12. Phase 5: resolutionPhoto is optional (must be string if present)
  if (item.resolutionPhoto !== undefined && item.resolutionPhoto !== null && typeof item.resolutionPhoto !== 'string') {
    return false;
  }

  // 13. Phase 6: isEmergency is optional (must be boolean if present)
  if (item.isEmergency !== undefined && typeof item.isEmergency !== 'boolean') {
    return false;
  }

  // 14. Phase 6: emergencyType is optional (must be string if present)
  if (item.emergencyType !== undefined && item.emergencyType !== null && typeof item.emergencyType !== 'string') {
    return false;
  }

  // 15. Phase 6: emergencyReason is optional (must be string if present)
  if (item.emergencyReason !== undefined && item.emergencyReason !== null && typeof item.emergencyReason !== 'string') {
    return false;
  }

  return true;
}

/**
 * Format date to YYYYMMDD string.
 * @param {Date} [date]
 * @returns {string} e.g. "20260929"
 */
export function getFormattedDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Retrieve all complaints stored in localStorage.
 * Throws ComplaintError if localStorage fails or stored data is invalid.
 * @returns {Array<Object>} Sorted by createdAt descending
 */
export function getAllComplaints() {
  if (!isStorageAvailable()) {
    throw new ComplaintError(
      'STORAGE_ERROR',
      'Local storage is disabled or unavailable in your browser.'
    );
  }

  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new ComplaintError(
      'STORAGE_ERROR',
      'Failed to read data from local storage: ' + (error?.message || 'Storage access error')
    );
  }

  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ComplaintError(
      'INVALID_STORED_DATA',
      'Stored complaint data in local storage is corrupted (invalid JSON syntax).'
    );
  }

  if (!Array.isArray(parsed)) {
    throw new ComplaintError(
      'INVALID_STORED_DATA',
      'Stored complaint data in local storage is corrupted (expected an array).'
    );
  }

  // Verify records and sort newest first
  const validComplaints = [];
  for (const item of parsed) {
    if (isValidComplaint(item)) {
      validComplaints.push(item);
    } else {
      console.warn('[Report2Resolve] Skipping corrupted complaint record in localStorage:', item);
    }
  }

  return validComplaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Save array of complaints to localStorage.
 * @param {Array<Object>} complaints 
 */
export function saveAllComplaints(complaints) {
  if (!isStorageAvailable()) {
    throw new ComplaintError(
      'STORAGE_ERROR',
      'Local storage is disabled or unavailable. Cannot save complaint.'
    );
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (error) {
    throw new ComplaintError(
      'STORAGE_ERROR',
      'Failed to save complaint to local storage. Storage quota may be full or blocked.'
    );
  }
}

/**
 * Generate a unique sequential Complaint ID in the format:
 * R2R-YYYYMMDD-XXX (e.g. R2R-20260929-001)
 * 
 * @param {Date} [date]
 * @returns {string}
 */
export function generateComplaintId(date = new Date()) {
  const dateStr = getFormattedDate(date);
  const prefix = `R2R-${dateStr}-`;
  
  let existing = [];
  try {
    existing = getAllComplaints();
  } catch (err) {
    // If reading failed due to corrupted data, start afresh or log
    console.warn('Could not read existing complaints for ID sequence:', err.message);
  }

  // Find all existing numbers for today's date prefix
  const todayIndices = existing
    .map(c => c.id)
    .filter(id => typeof id === 'string' && id.startsWith(prefix))
    .map(id => {
      const parts = id.split('-');
      const numPart = parseInt(parts[2], 10);
      return isNaN(numPart) ? 0 : numPart;
    });

  let nextIndex = 1;
  if (todayIndices.length > 0) {
    nextIndex = Math.max(...todayIndices) + 1;
  }

  let candidateId = `${prefix}${String(nextIndex).padStart(3, '0')}`;
  while (existing.some(c => c && c.id === candidateId)) {
    nextIndex++;
    candidateId = `${prefix}${String(nextIndex).padStart(3, '0')}`;
  }

  return candidateId;
}

/**
 * Create and persist a new citizen complaint in localStorage.
 * Initial status is strictly "Received".
 * 
 * @param {Object} data
 * @param {string} data.originalComplaint - Raw complaint text
 * @param {string} data.problem - AI-generated problem summary
 * @param {string} data.category - Civic category
 * @param {string} data.priority - Priority level (Critical, High, Medium, Low)
 * @param {string} data.department - Assigned municipal department
 * @param {string} [data.photoProof] - Optional Base64 data URL of citizen evidence photo
 * @param {Object} [data.locationProof] - Optional GPS coordinates { latitude, longitude, accuracy, capturedAt }
 * @param {boolean} [data.isEmergency] - Phase 6: Whether complaint is an urgent emergency
 * @param {string} [data.emergencyType] - Phase 6: Emergency classification hazard type
 * @param {string} [data.emergencyReason] - Phase 6: Justification of urgent safety hazard
 * @returns {Object} The created complaint record
 */
export function createComplaint({
  originalComplaint,
  problem,
  category,
  priority,
  department,
  photoProof = null,
  locationProof = null,
  isEmergency = false,
  emergencyType = 'None',
  emergencyReason = ''
}) {
  if (!originalComplaint || !String(originalComplaint).trim()) {
    throw new ComplaintError('VALIDATION_ERROR', 'Original complaint text is required.');
  }

  const id = generateComplaintId();
  const emergencyBool = Boolean(isEmergency);
  const newComplaint = {
    id,
    originalComplaint: String(originalComplaint).trim(),
    problem: problem ? String(problem).trim() : 'Civic Grievance',
    category: category ? String(category).trim() : 'Other',
    priority: emergencyBool ? 'Critical' : (priority ? String(priority).trim() : 'Medium'),
    department: department ? String(department).trim() : 'Municipal Administration',
    status: 'Received', // Strictly "Received" for newly created complaint
    createdAt: new Date().toISOString(),
    photoProof: typeof photoProof === 'string' ? photoProof : null,
    locationProof: locationProof && typeof locationProof === 'object' ? locationProof : null,
    resolutionPhoto: null,
    resolutionCapturedAt: null,
    isEmergency: emergencyBool,
    emergencyType: emergencyBool ? (emergencyType && emergencyType !== 'None' ? String(emergencyType).trim() : 'Civic Emergency Hazard') : 'None',
    emergencyReason: emergencyBool ? String(emergencyReason || 'Immediate threat to public safety.').trim() : ''
  };

  let existing = [];
  try {
    existing = getAllComplaints();
  } catch (err) {
    if (err.code === 'STORAGE_ERROR') {
      throw err;
    }
    // If data was corrupted, reset to empty array so user can save
    existing = [];
  }

  if (existing.some(c => c && c.id === id)) {
    throw new ComplaintError('DUPLICATE_ID', `Complaint ID collision detected (${id}). Please try again.`);
  }

  existing.unshift(newComplaint);
  saveAllComplaints(existing);

  return newComplaint;
}

/**
 * Find a complaint by its ID with complete error handling:
 * - Empty complaint ID
 * - Complaint not found
 * - Invalid stored data
 * - localStorage errors
 * 
 * @param {string} id 
 * @returns {Object} The complaint record
 * @throws {ComplaintError}
 */
export function getComplaintById(id) {
  // 1. Error handling for empty complaint ID
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new ComplaintError(
      'EMPTY_ID',
      'Please enter a Complaint ID to track.'
    );
  }

  const cleanId = id.trim().toUpperCase();

  // 2. Error handling for localStorage accessibility
  if (!isStorageAvailable()) {
    throw new ComplaintError(
      'STORAGE_ERROR',
      'Local storage is disabled or unavailable in your browser. Cannot retrieve complaint.'
    );
  }

  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new ComplaintError(
      'STORAGE_ERROR',
      'Failed to access local storage: ' + (error?.message || 'Storage error')
    );
  }

  if (!raw) {
    throw new ComplaintError(
      'NOT_FOUND',
      `No complaint found with ID "${cleanId}". Please check the ID and try again.`
    );
  }

  // 3. Error handling for invalid stored data (corrupted JSON)
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ComplaintError(
      'INVALID_STORED_DATA',
      'Stored complaint data in local storage is corrupted and could not be parsed.'
    );
  }

  if (!Array.isArray(parsed)) {
    throw new ComplaintError(
      'INVALID_STORED_DATA',
      'Stored complaint data format is corrupted (expected list of complaints).'
    );
  }

  // Search for the specific complaint
  const matchingItem = parsed.find(
    item => item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim().toUpperCase() === cleanId
  );

  // 4. Error handling for complaint not found
  if (!matchingItem) {
    throw new ComplaintError(
      'NOT_FOUND',
      `No complaint found with ID "${cleanId}". Please verify the ID or file a new problem.`
    );
  }

  // 5. Error handling for invalid stored data in this record
  if (!isValidComplaint(matchingItem)) {
    throw new ComplaintError(
      'INVALID_STORED_DATA',
      `Complaint "${cleanId}" exists but contains invalid or corrupted data fields.`
    );
  }

  return matchingItem;
}

/**
 * Phase 4: Citizen Resolution Verification
 * 
 * Flow:
 * 1. Complaint must first reach "Resolved" status.
 * 2. If isResolved is true:
 *    - citizenVerified is set to true.
 *    - verifiedAt timestamp recorded.
 *    - status remains "Resolved".
 * 3. If isResolved is false:
 *    - Reopen the complaint.
 *    - Set status back to "In Progress".
 *    - citizenVerified is set to false.
 *    - reopenedAt timestamp recorded.
 * 
 * Persists the updated state in localStorage.
 * 
 * @param {string} id - Complaint ID
 * @param {boolean} isResolved - true if citizen confirmed, false if not resolved / reopen
 * @returns {Object} Updated complaint record
 */
export function verifyComplaintResolution(id, isResolved) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new ComplaintError('EMPTY_ID', 'Please provide a valid Complaint ID to verify resolution.');
  }

  const cleanId = id.trim().toUpperCase();
  const all = getAllComplaints();
  const index = all.findIndex(c => c && c.id && c.id.trim().toUpperCase() === cleanId);

  if (index === -1) {
    throw new ComplaintError('NOT_FOUND', `Complaint "${cleanId}" was not found.`);
  }

  const current = all[index];
  const updated = { ...current };

  if (isResolved) {
    updated.citizenVerified = true;
    updated.verifiedAt = new Date().toISOString();
  } else {
    // Reopen complaint
    updated.status = 'In Progress';
    updated.citizenVerified = false;
    updated.reopenedAt = new Date().toISOString();
  }

  updated.updatedAt = new Date().toISOString();
  all[index] = updated;
  saveAllComplaints(all);

  return updated;
}

/**
 * Update complaint status in localStorage (for officer lifecycle updates or demo tests).
 * Allowed values: 'Received', 'Assigned', 'In Progress', 'Resolved'.
 * 
 * @param {string} id 
 * @param {string} newStatus 
 * @returns {Object} Updated complaint record
 */
export function updateComplaintStatus(id, newStatus) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new ComplaintError('EMPTY_ID', 'Complaint ID is required.');
  }
  if (!COMPLAINT_STATUSES.includes(newStatus)) {
    throw new ComplaintError('INVALID_STATUS', `Status must be one of: ${COMPLAINT_STATUSES.join(', ')}`);
  }

  const cleanId = id.trim().toUpperCase();
  const all = getAllComplaints();
  const index = all.findIndex(c => c && c.id && c.id.trim().toUpperCase() === cleanId);

  if (index === -1) {
    throw new ComplaintError('NOT_FOUND', `Complaint "${cleanId}" not found.`);
  }

  all[index] = {
    ...all[index],
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  saveAllComplaints(all);
  return all[index];
}

/**
 * Phase 5: Attach or update citizen evidence (photoProof or locationProof) for an existing complaint.
 * 
 * @param {string} id 
 * @param {Object} evidence 
 * @param {string} [evidence.photoProof] 
 * @param {Object} [evidence.locationProof] 
 * @returns {Object} Updated complaint record
 */
export function attachComplaintEvidence(id, { photoProof, locationProof }) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new ComplaintError('EMPTY_ID', 'Complaint ID is required.');
  }

  const cleanId = id.trim().toUpperCase();
  const all = getAllComplaints();
  const index = all.findIndex(c => c && c.id && c.id.trim().toUpperCase() === cleanId);

  if (index === -1) {
    throw new ComplaintError('NOT_FOUND', `Complaint "${cleanId}" not found.`);
  }

  const current = all[index];
  const updated = { ...current };

  if (photoProof !== undefined) {
    updated.photoProof = photoProof;
  }
  if (locationProof !== undefined) {
    updated.locationProof = locationProof;
  }

  updated.updatedAt = new Date().toISOString();
  all[index] = updated;
  saveAllComplaints(all);
  return updated;
}

/**
 * Phase 5: Attach resolution photo proof (after-photo) when a complaint is marked Resolved.
 * 
 * @param {string} id 
 * @param {string} resolutionPhoto - Base64 data URL of municipal resolution proof photo
 * @returns {Object} Updated complaint record
 */
export function attachResolutionPhoto(id, resolutionPhoto) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new ComplaintError('EMPTY_ID', 'Complaint ID is required.');
  }

  const cleanId = id.trim().toUpperCase();
  const all = getAllComplaints();
  const index = all.findIndex(c => c && c.id && c.id.trim().toUpperCase() === cleanId);

  if (index === -1) {
    throw new ComplaintError('NOT_FOUND', `Complaint "${cleanId}" not found.`);
  }

  all[index] = {
    ...all[index],
    resolutionPhoto: resolutionPhoto || null,
    resolutionCapturedAt: resolutionPhoto ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString()
  };

  saveAllComplaints(all);
  return all[index];
}

// Attach helpers to window in browser for dev/testing in console
if (typeof window !== 'undefined') {
  window.updateComplaintStatus = updateComplaintStatus;
  window.verifyComplaintResolution = verifyComplaintResolution;
  window.attachComplaintEvidence = attachComplaintEvidence;
  window.attachResolutionPhoto = attachResolutionPhoto;
}

