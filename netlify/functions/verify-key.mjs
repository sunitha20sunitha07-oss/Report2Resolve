/**
 * Netlify Function: verify-key.mjs
 * Handles: POST /api/verify-key
 */

import { GoogleGenAI } from '@google/genai';

function createJsonResponse(data, status = 200, isWebStandard = true) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (isWebStandard && typeof Response !== 'undefined') {
    return new Response(JSON.stringify(data), { status, headers });
  }

  return { statusCode: status, headers, body: JSON.stringify(data) };
}

export default async function handler(reqOrEvent) {
  const isWebStandard = Boolean(
    reqOrEvent && (typeof reqOrEvent.json === 'function' || typeof reqOrEvent.text === 'function')
  );

  const method = isWebStandard ? reqOrEvent.method : (reqOrEvent?.httpMethod || 'POST');
  if (method === 'OPTIONS') return createJsonResponse({ ok: true }, 200, isWebStandard);
  if (method !== 'POST') return createJsonResponse({ error: 'Method not allowed' }, 405, isWebStandard);

  let body = {};
  try {
    if (isWebStandard) {
      body = typeof reqOrEvent.json === 'function' ? await reqOrEvent.json() : JSON.parse(await reqOrEvent.text());
    } else {
      body = typeof reqOrEvent?.body === 'string' ? JSON.parse(reqOrEvent.body) : (reqOrEvent?.body || {});
    }
  } catch {
    body = {};
  }

  let headerApiKey = null;
  if (isWebStandard && typeof reqOrEvent.headers?.get === 'function') {
    headerApiKey = reqOrEvent.headers.get('x-gemini-api-key');
  } else if (reqOrEvent?.headers) {
    headerApiKey = reqOrEvent.headers['x-gemini-api-key'] || reqOrEvent.headers['X-Gemini-Api-Key'];
  }

  const apiKey = (
    body?.apiKey ||
    headerApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return createJsonResponse({ valid: false, error: 'No API key provided.' }, 400, isWebStandard);
  }

  const baseUrl = (process.env.GOOGLE_GEMINI_BASE_URL || '').trim();
  const clientOptions = {
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' }
    }
  };
  if (baseUrl) clientOptions.httpOptions.baseUrl = baseUrl;

  try {
    const client = new GoogleGenAI(clientOptions);
    const res = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'ping',
    });
    return createJsonResponse({ valid: true, model: 'gemini-3.8-flash' }, 200, isWebStandard);
  } catch (err) {
    return createJsonResponse({ valid: false, error: err?.message || 'Invalid API key.' }, 200, isWebStandard);
  }
}

export const config = {
  path: "/api/verify-key"
};
