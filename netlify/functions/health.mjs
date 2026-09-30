/**
 * Netlify Function: health.mjs
 * Handles: GET /api/health
 */

export default async function handler(reqOrEvent) {
  const isWebStandard = Boolean(
    reqOrEvent && (typeof reqOrEvent.json === 'function' || typeof reqOrEvent.text === 'function')
  );

  const data = {
    status: 'ok',
    environment: 'netlify-functions',
    hasServerKey: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    hasAiGatewayBaseUrl: Boolean(process.env.GOOGLE_GEMINI_BASE_URL)
  };

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (isWebStandard && typeof Response !== 'undefined') {
    return new Response(JSON.stringify(data), { status: 200, headers });
  }

  return { statusCode: 200, headers, body: JSON.stringify(data) };
}

export const config = {
  path: "/api/health"
};
