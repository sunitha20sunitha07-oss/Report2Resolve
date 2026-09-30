/**
 * Report2Resolve - AI Grievance Classification Service
 * 
 * Accurately analyzes citizen complaints in Tamil, English, and Tanglish
 * using Google Gemini AI, extracting problem summary, category,
 * priority, and designated municipal department.
 * 
 * Communicates with the server-side /api/analyze proxy route as required
 * by AI Studio architecture guidelines.
 */

export const CIVIC_CATEGORIES = [
  'Roads / Potholes',
  'Street Lighting / Electrical',
  'Water Supply',
  'Sanitation / Waste',
  'Drainage',
  'Public Transport',
  'Public Safety',
  'Government Services',
  'Other'
];

export const STORAGE_KEY_GEMINI = 'gemini_api_key';

/**
 * Retrieve the active Gemini API key from localStorage or Vite environment.
 * @returns {string}
 */
export function getActiveApiKey() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY_GEMINI);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    }
  } catch (e) {
    console.warn('[AI Service] Could not read API key from localStorage:', e);
  }

  // Vite environment variable support
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY.trim();
  }

  return '';
}

/**
 * Check if a Gemini API key is configured in browser or environment.
 * @returns {boolean}
 */
export function isApiKeyConfigured() {
  return Boolean(getActiveApiKey());
}

/**
 * Persist Gemini API key to browser localStorage.
 * @param {string} apiKey 
 */
export function saveApiKeyToStorage(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('Please enter a valid Gemini API key.');
  }

  const clean = apiKey.trim();
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY_GEMINI, clean);
    window.dispatchEvent(new Event('gemini_key_updated'));
  }
}

/**
 * Remove stored Gemini API key from browser localStorage.
 */
export function clearStoredApiKey() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY_GEMINI);
    window.dispatchEvent(new Event('gemini_key_updated'));
  }
}

/**
 * Test/verify if a given Gemini API key is working.
 * @param {string} apiKey 
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function verifyApiKey(apiKey) {
  const keyToTest = (apiKey || getActiveApiKey()).trim();
  if (!keyToTest) {
    return { valid: false, error: 'No API key provided.' };
  }

  try {
    const res = await fetch('/api/verify-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': keyToTest
      },
      body: JSON.stringify({ apiKey: keyToTest })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.valid) {
      return { valid: true };
    }
    return { valid: false, error: data.error || 'Invalid API key.' };
  } catch (err) {
    return { valid: false, error: err?.message || 'Verification request failed.' };
  }
}

/**
 * Analyze a citizen complaint with Google Gemini AI.
 * 
 * @param {string} complaintText - Raw complaint text in Tamil, English, or Tanglish
 * @param {string} [customApiKey] - Optional API key override
 * @param {Function} [onStatusUpdate] - Status callback for UI feedback
 * @returns {Promise<{problem: string, category: string, priority: string, department: string}>}
 */
export async function analyzeComplaintWithGemini(complaintText, customApiKey = '', onStatusUpdate = null) {
  if (!complaintText || !complaintText.trim()) {
    throw new Error('Please enter a complaint description.');
  }

  const activeKey = (customApiKey || getActiveApiKey()).trim();

  if (onStatusUpdate) onStatusUpdate('Analyzing grievance with Google Gemini AI...');

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (activeKey) {
      headers['x-gemini-api-key'] = activeKey;
    }

    let response = await fetch('/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        complaintText: complaintText.trim(),
        apiKey: activeKey 
      })
    });

    // In case the redirect from /api/analyze to /.netlify/functions/analyze is not yet active:
    if (response.status === 404) {
      try {
        const netlifyFunctionRes = await fetch('/.netlify/functions/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            complaintText: complaintText.trim(),
            apiKey: activeKey 
          })
        });
        if (netlifyFunctionRes.status !== 404) {
          response = netlifyFunctionRes;
        }
      } catch (fallbackErr) {
        console.warn('Fallback to /.netlify/functions/analyze failed:', fallbackErr);
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `Server returned error (${response.status})`;
      const err = new Error(errorMsg);
      if (data.needsApiKey || response.status === 401) {
        err.needsApiKey = true;
      }
      throw err;
    }

    if (!data.problem && !data.category) {
      throw new Error('Invalid response structure received from analysis service.');
    }

    return {
      problem: data.problem || 'Civic Issue Summary',
      category: data.category || 'Other',
      priority: data.priority || 'Medium',
      department: data.department || 'Local Civic Administration',
      isEmergency: Boolean(data.isEmergency),
      emergencyType: data.emergencyType || (data.isEmergency ? 'Civic Emergency Hazard' : 'None'),
      emergencyReason: data.emergencyReason || ''
    };

  } catch (error) {
    console.error('[AI Service Error]:', error);
    throw error;
  }
}
