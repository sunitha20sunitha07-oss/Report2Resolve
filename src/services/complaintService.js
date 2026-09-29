/**
 * Report2Resolve - Complaint Persistence & Lifecycle Service
 * 
 * Manages complaint persistence in browser localStorage, unique ID generation
 * (R2R-YYYYMMDD-XXX), and status tracking.
 */

const STORAGE_KEY = 'report2resolve_complaints';

export const COMPLAINT_STATUSES = [
  'Received',
  'Assigned',
  'In Progress',
  'Resolved'
];

/**
 * Check if browser localStorage is available and functioning.
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Retrieve all complaints stored in localStorage.
 * @returns {Array<Object>} Sorted by createdAt descending
 */
export function getAllComplaints() {
  if (!isStorageAvailable()) {
    console.warn('localStorage is unavailable.');
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter valid complaints and sort newest first
    return parsed
      .filter(item => item && typeof item === 'object' && item.id)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (error) {
    console.error('Failed to parse stored complaints:', error);
    return [];
  }
}

/**
 * Save array of complaints to localStorage.
 * @param {Array<Object>} complaints 
 */
function saveAllComplaints(complaints) {
  if (!isStorageAvailable()) {
    throw new Error('Browser storage (localStorage) is disabled or full. Cannot save complaint.');
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (error) {
    console.error('Error saving complaints to localStorage:', error);
    throw new Error('Failed to save complaint to local storage. Storage quota may be exceeded.');
  }
}

/**
 * Format current date to YYYYMMDD string.
 * @param {Date} [date]
 * @returns {string} e.g. "20260928"
 */
function getFormattedDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generate a unique, sequential Complaint ID in the format:
 * R2R-YYYYMMDD-XXX (e.g. R2R-20260928-001)
 * 
 * @returns {string}
 */
export function generateComplaintId() {
  const dateStr = getFormattedDate();
  const prefix = `R2R-${dateStr}-`;
  const existing = getAllComplaints();

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

  // Ensure uniqueness in case of collision
  let candidateId = `${prefix}${String(nextIndex).padStart(3, '0')}`;
  while (existing.some(c => c.id === candidateId)) {
    nextIndex++;
    candidateId = `${prefix}${String(nextIndex).padStart(3, '0')}`;
  }

  return candidateId;
}

/**
 * Create and persist a new citizen complaint.
 * 
 * @param {Object} data
 * @param {string} data.originalComplaint - Raw complaint text in native language
 * @param {string} data.problem - English problem summary extracted by Gemini
 * @param {string} data.category - Civic category
 * @param {string} data.priority - Priority level (Critical, High, Medium, Low)
 * @param {string} data.department - Assigned municipal department
 * @returns {Object} The created complaint record
 */
export function createComplaint({
  originalComplaint,
  problem,
  category,
  priority,
  department
}) {
  if (!originalComplaint || !originalComplaint.trim()) {
    throw new Error('Original complaint text is required.');
  }

  const id = generateComplaintId();
  const newComplaint = {
    id,
    originalComplaint: originalComplaint.trim(),
    problem: problem || 'Civic Grievance',
    category: category || 'Other',
    priority: priority || 'Medium',
    department: department || 'Municipal Administration',
    status: 'Received',
    createdAt: new Date().toISOString()
  };

  const existing = getAllComplaints();

  // Double check ID uniqueness
  if (existing.some(c => c.id === id)) {
    throw new Error(`Duplicate complaint ID detected (${id}). Please retry.`);
  }

  existing.unshift(newComplaint);
  saveAllComplaints(existing);

  return newComplaint;
}

/**
 * Find a complaint by its ID (case-insensitive and trimmed).
 * 
 * @param {string} id 
 * @returns {Object|null}
 */
export function getComplaintById(id) {
  if (!id || typeof id !== 'string') return null;
  const cleanId = id.trim().toUpperCase();

  const all = getAllComplaints();
  return all.find(c => c.id && c.id.toUpperCase() === cleanId) || null;
}

/**
 * Update the status of an existing complaint.
 * 
 * @param {string} id 
 * @param {string} newStatus - One of 'Received', 'Assigned', 'In Progress', 'Resolved'
 * @returns {Object} Updated complaint
 */
export function updateComplaintStatus(id, newStatus) {
  if (!COMPLAINT_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Allowed: ${COMPLAINT_STATUSES.join(', ')}`);
  }

  const all = getAllComplaints();
  const cleanId = (id || '').trim().toUpperCase();
  const index = all.findIndex(c => c.id && c.id.toUpperCase() === cleanId);

  if (index === -1) {
    throw new Error(`Complaint with ID "${id}" was not found.`);
  }

  all[index] = {
    ...all[index],
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  saveAllComplaints(all);
  return all[index];
}
