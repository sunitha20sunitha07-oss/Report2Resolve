import { GoogleGenerativeAI } from '@google/generative-ai';

const STORAGE_KEY = 'report2resolve_gemini_api_key';

/**
 * Supported civic categories
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

/**
 * Retrieve the active Gemini API key from environment or local storage.
 * @returns {string} The active key or empty string.
 */
export function getActiveApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
    return envKey.trim();
  }
  return (localStorage.getItem(STORAGE_KEY) || '').trim();
}

/**
 * Check if a Gemini API key is configured.
 * @returns {boolean}
 */
export function isApiKeyConfigured() {
  return Boolean(getActiveApiKey());
}

/**
 * Save user API key to localStorage (for easy testing without editing files).
 * @param {string} key 
 */
export function saveApiKeyToStorage(key) {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Remove stored API key from localStorage.
 */
export function clearStoredApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Classify error to distinguish 503, 429, 401/403, and 400.
 * 
 * - 503 -> Temporary service overload -> retry
 * - 429 -> Rate limit -> retry with backoff
 * - 401/403 -> Authentication/API key error -> do not retry
 * - 400 -> Bad request / configuration error -> do not retry
 */
function classifyGeminiError(error) {
  const status = error?.status;
  const msg = String(error?.message || '').toLowerCase();

  // 401 / 403: API key / authentication problem -> DO NOT RETRY
  if (
    status === 401 ||
    status === 403 ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('unauthenticated') ||
    msg.includes('permission_denied')
  ) {
    return {
      type: 'AUTH_ERROR',
      canRetry: false,
      userMessage: 'Invalid Gemini API Key. Please verify your API key in the configuration settings.'
    };
  }

  // 400: Request / configuration problem -> DO NOT RETRY
  if (
    status === 400 ||
    msg.includes('400') ||
    msg.includes('invalid_argument') ||
    msg.includes('bad request')
  ) {
    return {
      type: 'BAD_REQUEST',
      canRetry: false,
      userMessage: 'Request configuration error with Gemini API. Please check complaint input.'
    };
  }

  // 503: Temporary service overload / high demand -> RETRY
  if (
    status === 503 ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('service unavailable') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('model is overloaded')
  ) {
    return {
      type: 'SERVICE_OVERLOAD',
      canRetry: true,
      userMessage: 'Gemini is temporarily busy. Retrying...'
    };
  }

  // 429: Rate limit -> RETRY WITH BACKOFF
  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit')
  ) {
    return {
      type: 'RATE_LIMIT',
      canRetry: true,
      userMessage: 'Gemini rate limit reached. Retrying...'
    };
  }

  // Network connection failures -> RETRY
  if (msg.includes('failed to fetch') || error?.name === 'TypeError') {
    return {
      type: 'NETWORK_ERROR',
      canRetry: true,
      userMessage: 'Network error connecting to Gemini API. Retrying...'
    };
  }

  return {
    type: 'UNKNOWN',
    canRetry: false,
    userMessage: error?.message || 'Failed to analyze complaint with Gemini AI.'
  };
}

/**
 * Construct system instructions and prompt for Gemini model.
 */
const SYSTEM_PROMPT = `
You are the AI engine for "Report2Resolve", a civic public-service grievance classification system.

Analyze the given citizen complaint and extract structured information.

Guidelines:
1. Understand complaints written in Tamil (தமிழ்), English, Tanglish (Tamil written in English script), or other Indian regional languages.
2. Summarize the actual civic/public-service problem concisely in English.
3. Classify into exactly ONE of the following supported categories:
   - Roads / Potholes
   - Street Lighting / Electrical
   - Water Supply
   - Sanitation / Waste
   - Drainage
   - Public Transport
   - Public Safety
   - Government Services
   - Other
4. Determine priority as "Critical", "High", "Medium", or "Low" based ONLY on the complaint:
   - "Critical": Immediate danger to life, live electrical wires, major public safety hazard, flooding inside homes.
   - "High": Serious issue requiring quick municipal attention (e.g. major pothole on highway, open manhole, water supply contaminated).
   - "Medium": Normal civic grievance (e.g. street light not functioning for days, garbage accumulation on street corner).
   - "Low": Minor, aesthetic, or non-urgent civic issue.
5. Suggest the most appropriate government/public-service department (e.g. "Municipal Electrical Department", "Public Works Department (PWD)", "Water Supply and Drainage Board (TWAD / Metro Water)", "Corporation Health & Sanitation Department", "Traffic Police Department", "State Transport Corporation").
6. Never invent personal names, phone numbers, or private details.
7. If the complaint text is unclear, nonsensical, or cannot be determined, set the fields to reasonable "Unknown" values instead of fabricating details.
8. Output MUST be valid JSON adhering strictly to this schema:
{
  "problem": "Brief English description of the problem",
  "category": "One of the supported categories",
  "priority": "Critical | High | Medium | Low",
  "department": "Name of appropriate municipal/public-service department"
}
`;

/**
 * Analyze a citizen complaint using real Google Gemini API with exponential backoff retry.
 * 
 * Retry Policy:
 * - Up to 3 retries (total 4 attempts) on HTTP 503 (high demand) or HTTP 429 (rate limit)
 * - Exponential backoff: 2s (attempt 1), 4s (attempt 2), 8s (attempt 3)
 * - Instant fail on 401, 403, 400
 * 
 * @param {string} complaintText 
 * @param {string} [customApiKey] - Optional override key
 * @param {Function} [onStatusUpdate] - Status callback for UI loading feedback
 * @returns {Promise<{problem: string, category: string, priority: string, department: string}>}
 */
export async function analyzeComplaintWithGemini(complaintText, customApiKey = '', onStatusUpdate = null) {
  const apiKey = (customApiKey || getActiveApiKey()).trim();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please click "Configure API Key" in the top bar or set VITE_GEMINI_API_KEY in your .env file.'
    );
  }

  if (!complaintText || !complaintText.trim()) {
    throw new Error('Please enter a complaint description.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // We use gemini-3.8-flash for fast, accurate multilingual analysis
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.8-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    }
  });

  const prompt = `${SYSTEM_PROMPT}\n\nCitizen Complaint:\n"${complaintText.trim()}"\n\nReturn JSON:`;

  const BACKOFF_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s
  const MAX_RETRIES = 3;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        if (onStatusUpdate) {
          onStatusUpdate('Gemini is temporarily busy. Retrying...');
        }
      } else {
        if (onStatusUpdate) {
          onStatusUpdate('Analyzing complaint...');
        }
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      if (!text) {
        throw new Error('Empty response received from Gemini AI.');
      }

      // Clean any markdown code blocks if present
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(text);

      // Validate and sanitize required fields
      const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
      const matchedPriority = validPriorities.find(
        p => p.toLowerCase() === String(parsed.priority || '').toLowerCase()
      ) || 'Medium';

      return {
        problem: parsed.problem || 'Unknown Civic Issue',
        category: parsed.category || 'Other',
        priority: matchedPriority,
        department: parsed.department || 'Local Civic Administration'
      };
    } catch (error) {
      lastError = error;
      console.warn(`[Gemini API Attempt ${attempt + 1}/${MAX_RETRIES + 1} Failed]:`, error?.message || error);

      const classification = classifyGeminiError(error);

      // If non-retryable (e.g. 401/403 Auth error, 400 Bad request), fail immediately
      if (!classification.canRetry) {
        throw new Error(classification.userMessage);
      }

      // If we still have retries remaining, wait with exponential backoff
      if (attempt < MAX_RETRIES) {
        const waitMs = BACKOFF_DELAYS[attempt];
        if (onStatusUpdate) {
          onStatusUpdate('Gemini is temporarily busy. Retrying...');
        }
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }
  }

  // If all 3 retries (4 total attempts) fail:
  const finalClass = classifyGeminiError(lastError);
  if (finalClass.type === 'SERVICE_OVERLOAD' || finalClass.type === 'RATE_LIMIT' || finalClass.type === 'NETWORK_ERROR') {
    throw new Error('Gemini is temporarily unavailable. Please try again in a moment.');
  }

  throw new Error(finalClass.userMessage || 'Gemini is temporarily unavailable. Please try again in a moment.');
}
