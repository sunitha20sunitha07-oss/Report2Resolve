/**
 * Netlify Function: analyze.mjs
 * Handles: POST /api/analyze
 * 
 * Powered by Google Gemini AI via @google/genai SDK.
 * Automatically utilizes Netlify AI Gateway credentials:
 * - GEMINI_API_KEY
 * - GOOGLE_GEMINI_BASE_URL
 * 
 * Preserves full Report2Resolve schema:
 * { problem, category, priority, department, isEmergency, emergencyType, emergencyReason }
 */

import { GoogleGenAI } from '@google/genai';

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
6. EMERGENCY DETECTION (Phase 6):
   Determine whether this complaint represents an urgent civic emergency with immediate threat to life, physical safety, severe fire, gas toxicity, or major public hazard.
   - True emergency examples:
     * "Gas leak near my house" -> isEmergency: true, emergencyType: "Gas Leak / Toxic Vapor Hazard", emergencyReason: "Immediate risk of fire, explosion, or toxic inhalation in residential area."
     * "Fire in the building" -> isEmergency: true, emergencyType: "Active Fire Hazard", emergencyReason: "Immediate threat to human life and structural destruction."
     * "Live electrical wire fallen on road" -> isEmergency: true, emergencyType: "Live High-Voltage Wire Hazard", emergencyReason: "Severe electrocution risk to pedestrians and vehicular traffic."
   - Non-emergency examples (standard priority):
     * "Street light not working for 3 days" -> isEmergency: false, emergencyType: "None", emergencyReason: ""
     * "Garbage not collected for 2 days" -> isEmergency: false, emergencyType: "None", emergencyReason: ""
     * "Small pothole on local street" -> isEmergency: false, emergencyType: "None", emergencyReason: ""
   - isEmergency must be a boolean (true or false).
   - emergencyType must be a short string describing the hazard or "None".
   - emergencyReason must be a concise explanation of the life-safety threat or empty string if not an emergency.
   - If isEmergency is true, set priority to "Critical".
7. Never invent personal names, phone numbers, or private details.
8. If the complaint text is unclear, nonsensical, or cannot be determined, set the fields to reasonable "Unknown" values instead of fabricating details.
9. Output MUST be valid JSON adhering strictly to this schema:
{
  "problem": "Brief English description of the problem",
  "category": "One of the supported categories",
  "priority": "Critical | High | Medium | Low",
  "department": "Name of appropriate municipal/public-service department",
  "isEmergency": true | false,
  "emergencyType": "Specific emergency category or None",
  "emergencyReason": "Concise justification of urgent safety threat or empty string"
}
`;

// Helper to build JSON response supporting both Web standard Response and AWS Lambda event style
function createJsonResponse(data, status = 200, isWebStandard = true) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (isWebStandard && typeof Response !== 'undefined') {
    return new Response(JSON.stringify(data), {
      status,
      headers
    });
  }

  return {
    statusCode: status,
    headers,
    body: JSON.stringify(data)
  };
}

export default async function handler(reqOrEvent, context) {
  const isWebStandard = Boolean(
    reqOrEvent && (typeof reqOrEvent.json === 'function' || typeof reqOrEvent.text === 'function')
  );

  // Determine HTTP Method
  const method = isWebStandard ? reqOrEvent.method : (reqOrEvent?.httpMethod || 'POST');

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    return createJsonResponse({ ok: true }, 200, isWebStandard);
  }

  if (method !== 'POST') {
    return createJsonResponse({ error: 'Method not allowed. Use POST.' }, 405, isWebStandard);
  }

  // Parse Body safely
  let body = {};
  try {
    if (isWebStandard) {
      if (typeof reqOrEvent.json === 'function') {
        body = await reqOrEvent.json();
      } else {
        const text = await reqOrEvent.text();
        body = text ? JSON.parse(text) : {};
      }
    } else {
      if (typeof reqOrEvent?.body === 'string') {
        body = JSON.parse(reqOrEvent.body);
      } else if (reqOrEvent?.body) {
        body = reqOrEvent.body;
      }
    }
  } catch (err) {
    console.warn('[Netlify Function /api/analyze] Failed to parse JSON request body:', err);
    return createJsonResponse({ error: 'Invalid JSON request body.' }, 400, isWebStandard);
  }

  const complaintText = body?.complaintText;
  if (!complaintText || typeof complaintText !== 'string' || !complaintText.trim()) {
    return createJsonResponse({ error: 'Complaint text is required.' }, 400, isWebStandard);
  }

  // Resolve API Key:
  // 1. Netlify AI Gateway automatically populates process.env.GEMINI_API_KEY
  // 2. Fallback to process.env.VITE_GEMINI_API_KEY
  // 3. Fallback to header or body apiKey if provided
  let headerApiKey = null;
  if (isWebStandard && typeof reqOrEvent.headers?.get === 'function') {
    headerApiKey = reqOrEvent.headers.get('x-gemini-api-key');
  } else if (reqOrEvent?.headers) {
    headerApiKey = reqOrEvent.headers['x-gemini-api-key'] || reqOrEvent.headers['X-Gemini-Api-Key'];
  }

  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    headerApiKey ||
    body?.apiKey ||
    ''
  ).trim();

  if (!apiKey) {
    return createJsonResponse({
      error: 'Google Gemini API key is not configured. Please ensure Netlify AI Gateway is enabled or set GEMINI_API_KEY in your Netlify site environment variables.',
      needsApiKey: true
    }, 401, isWebStandard);
  }

  // Netlify AI Gateway Base URL (automatically populated when using AI Gateway)
  const baseUrl = (process.env.GOOGLE_GEMINI_BASE_URL || '').trim();

  const clientOptions = {
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  };

  if (baseUrl) {
    clientOptions.httpOptions.baseUrl = baseUrl;
  }

  try {
    const client = new GoogleGenAI(clientOptions);
    const prompt = `${SYSTEM_PROMPT}\n\nCitizen Complaint:\n"${complaintText.trim()}"\n\nReturn JSON:`;

    let response;
    // Primary model: gemini-3.8-flash (standard Gemini 3 supported by Netlify AI Gateway and Google GenAI SDK)
    try {
      response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
    } catch (modelErr) {
      const errMsg = String(modelErr?.message || '');
      // Fallback if specific model is not mapped in the current AI Gateway tier
      if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('is not supported')) {
        console.warn('[Netlify Function] gemini-3.8-flash fallback triggered:', errMsg);
        response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
      } else {
        throw modelErr;
      }
    }

    let text = response?.text || '';

    // Extract JSON substring if formatted inside markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    if (!text) {
      throw new Error('Empty response received from Gemini model.');
    }

    const parsed = JSON.parse(text);

    const isEmergency = Boolean(parsed.isEmergency);
    const emergencyType = isEmergency 
      ? String(parsed.emergencyType || 'Civic Emergency Hazard').trim()
      : 'None';
    const emergencyReason = isEmergency
      ? String(parsed.emergencyReason || 'Immediate threat to public safety and physical wellbeing.').trim()
      : '';

    const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
    const matchedPriority = isEmergency 
      ? 'Critical' 
      : (validPriorities.find(p => p.toLowerCase() === String(parsed.priority || '').toLowerCase()) || 'Medium');

    const finalResult = {
      problem: parsed.problem || 'Unknown Civic Issue',
      category: parsed.category || 'Other',
      priority: matchedPriority,
      department: parsed.department || 'Local Civic Administration',
      isEmergency,
      emergencyType,
      emergencyReason,
    };

    return createJsonResponse(finalResult, 200, isWebStandard);

  } catch (error) {
    console.error('[Netlify Function /api/analyze Error]:', error);
    let msg = error?.message || 'Failed to analyze complaint with Gemini AI.';
    try {
      const parsedErr = JSON.parse(msg);
      if (parsedErr?.error?.message) {
        msg = parsedErr.error.message;
      }
    } catch {
      // Keep original msg
    }

    const isAuthError = msg.toLowerCase().includes('api_key') || 
                        msg.toLowerCase().includes('api key') ||
                        msg.toLowerCase().includes('unauthenticated');

    return createJsonResponse({
      error: msg,
      needsApiKey: isAuthError
    }, isAuthError ? 401 : 500, isWebStandard);
  }
}

export const config = {
  path: "/api/analyze"
};
