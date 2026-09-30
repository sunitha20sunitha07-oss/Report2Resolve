/**
 * Netlify Function: health.mjs
 * Route: /.netlify/functions/health (and rewritten from /api/health)
 */

export async function handler(reqOrEvent) {
  const isWebStandard = Boolean(
    reqOrEvent && (typeof reqOrEvent.json === 'function' || typeof reqOrEvent.text === 'function' || (typeof Request !== 'undefined' && reqOrEvent instanceof Request))
  );

  const data = {
    status: 'ok',
    environment: 'netlify-functions',
    hasServerKey: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    hasAiGatewayBaseUrl: Boolean(process.env.GOOGLE_GEMINI_BASE_URL),
    timestamp: new Date().toISOString()
  };

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (isWebStandard && typeof Response !== 'undefined') {
    return new Response(JSON.stringify(data), { status: 200, headers });
  }

  return { statusCode: 200, headers, body: JSON.stringify(data) };
}

export default handler;
