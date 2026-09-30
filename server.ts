import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load environment files (.env, .env.local, .dev.env.json)
function loadEnvironment() {
  const envFiles = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.dev.env.json'),
    '/app/.dev.env.json',
  ];

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf-8').trim();
        if (!raw) continue;
        if (file.endsWith('.json')) {
          const json = JSON.parse(raw);
          for (const [k, v] of Object.entries(json)) {
            if (v && typeof v === 'string' && !process.env[k]) {
              process.env[k] = v;
            }
          }
        } else {
          for (const line of raw.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const [key, ...values] = trimmed.split('=');
              const val = values.join('=').trim().replace(/^["']|["']$/g, '');
              const k = key.trim();
              if (k && !process.env[k]) {
                process.env[k] = val;
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Could not load environment from ${file}:`, e);
      }
    }
  }
}

function resolveApiKey(req: Request): string {
  loadEnvironment();
  const headerKey = req.headers['x-gemini-api-key'];
  return (
    (typeof headerKey === 'string' && headerKey.trim()) ||
    (typeof req.body?.apiKey === 'string' && req.body.apiKey.trim()) ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

function logServerDebug(message: string) {
  try {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync('/tmp/gemini_server.log', line);
    console.log(`[Gemini Server] ${message}`);
  } catch (e) {}
}

loadEnvironment();

interface Complaint {
  id: string;
  originalComplaint: string;
  problem: string;
  category: string;
  priority: string;
  department: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  citizenVerified?: boolean;
  verifiedAt?: string;
  reopenedAt?: string;
  photoProof?: string | null;
  locationProof?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt: string;
  } | null;
  resolutionPhoto?: string | null;
  resolutionCapturedAt?: string | null;
  isEmergency?: boolean;
  emergencyType?: string;
  emergencyReason?: string;
}

// In-memory store (empty initially; client stores complaints in localStorage as per Phase 3 requirements)
const complaintsStore: Complaint[] = [];

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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasServerKey: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    });
  });

  // Verify Gemini API key endpoint
  app.post('/api/verify-key', async (req: Request, res: Response) => {
    try {
      const apiKey = resolveApiKey(req);
      logServerDebug(`verify-key request received. Key present: ${Boolean(apiKey)}`);

      if (!apiKey) {
        return res.status(400).json({ valid: false, error: 'No API key provided.' });
      }

      const client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let response;
      try {
        response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'Say OK',
        });
      } catch (mErr: any) {
        if (String(mErr?.message || '').toLowerCase().includes('not found')) {
          logServerDebug('gemini-3.8-flash not found in verify-key, trying gemini-flash-latest');
          response = await client.models.generateContent({
            model: 'gemini-flash-latest',
            contents: 'Say OK',
          });
        } else {
          throw mErr;
        }
      }

      logServerDebug('verify-key succeeded');
      return res.json({ valid: true, response: response.text?.trim() });
    } catch (err: any) {
      logServerDebug(`verify-key error: ${err?.message}`);
      let msg = err?.message || 'Invalid API key';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      } catch (e) {}
      return res.status(400).json({ valid: false, error: msg });
    }
  });

  // AI analysis endpoint
  app.post('/api/analyze', async (req: Request, res: Response) => {
    try {
      const { complaintText } = req.body;
      logServerDebug(`POST /api/analyze received. Complaint length: ${String(complaintText || '').length}`);

      if (!complaintText || !String(complaintText).trim()) {
        return res.status(400).json({ error: 'Please enter a complaint description.' });
      }

      const apiKey = resolveApiKey(req);
      logServerDebug(`POST /api/analyze apiKey resolved: ${Boolean(apiKey)} (length ${apiKey.length})`);

      if (!apiKey) {
        return res.status(401).json({
          error: 'Gemini API key is not configured. Please click "Set Gemini Key" in the top navigation bar to configure your Gemini API Key.',
          needsApiKey: true
        });
      }

      const client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `${SYSTEM_PROMPT}\n\nCitizen Complaint:\n"${String(complaintText).trim()}"\n\nReturn JSON:`;

      let response;
      try {
        response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
      } catch (modelErr: any) {
        const errMsg = String(modelErr?.message || '');
        if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('is not supported')) {
          logServerDebug('gemini-3.8-flash not supported, falling back to gemini-flash-latest');
          response = await client.models.generateContent({
            model: 'gemini-flash-latest',
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

      let text = response.text || '';
      logServerDebug(`Gemini raw response text received: ${text.slice(0, 100)}...`);

      // Extract JSON cleanly
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      if (!text) {
        throw new Error('Empty response received from Gemini AI.');
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

      logServerDebug(`Successfully analyzed grievance: ${JSON.stringify(finalResult)}`);
      return res.json(finalResult);
    } catch (error: any) {
      logServerDebug(`Error analyzing complaint with Gemini: ${error?.message || error}`);
      console.error('Error analyzing complaint with Gemini:', error);
      let msg = error?.message || 'Failed to analyze complaint with Gemini AI.';
      try {
        const parsedErr = JSON.parse(msg);
        if (parsedErr?.error?.message) {
          msg = parsedErr.error.message;
        }
      } catch (e) {}
      return res.status(500).json({ error: msg });
    }
  });

  // List all complaints
  app.get('/api/complaints', (req: Request, res: Response) => {
    res.json(complaintsStore);
  });

  // Get complaint by ID
  app.get('/api/complaints/:id', (req: Request, res: Response) => {
    const id = req.params.id.trim().toUpperCase();
    const found = complaintsStore.find(c => c.id.toUpperCase() === id);
    if (!found) {
      return res.status(404).json({ error: `Complaint with ID "${id}" not found.` });
    }
    return res.json(found);
  });

  // Create new complaint
  app.post('/api/complaints', (req: Request, res: Response) => {
    const { originalComplaint, problem, category, priority, department } = req.body;
    if (!originalComplaint || !String(originalComplaint).trim()) {
      return res.status(400).json({ error: 'Original complaint text is required.' });
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefix = `R2R-${dateStr}-`;
    const todayComplaints = complaintsStore.filter(c => c.id.startsWith(prefix));
    const nextNum = todayComplaints.length + 1;
    const newId = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const newComplaint: Complaint = {
      id: newId,
      originalComplaint: String(originalComplaint).trim(),
      problem: problem || 'Civic Grievance',
      category: category || 'Other',
      priority: priority || 'Medium',
      department: department || 'Municipal Administration',
      status: 'Received',
      createdAt: now.toISOString(),
    };

    complaintsStore.unshift(newComplaint);
    return res.status(201).json(newComplaint);
  });

  // Update complaint status
  app.patch('/api/complaints/:id/status', (req: Request, res: Response) => {
    const id = req.params.id.trim().toUpperCase();
    const { status } = req.body;
    const allowed = ['Received', 'Assigned', 'In Progress', 'Resolved'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const complaint = complaintsStore.find(c => c.id.toUpperCase() === id);
    if (!complaint) {
      return res.status(404).json({ error: `Complaint with ID "${id}" not found.` });
    }

    complaint.status = status;
    complaint.updatedAt = new Date().toISOString();
    return res.json(complaint);
  });

  // Verify complaint resolution endpoint (Phase 4)
  app.post('/api/complaints/:id/verify', (req: Request, res: Response) => {
    const id = req.params.id.trim().toUpperCase();
    const { isResolved } = req.body;

    const complaint = complaintsStore.find(c => c.id.toUpperCase() === id);
    if (!complaint) {
      return res.status(404).json({ error: `Complaint with ID "${id}" not found.` });
    }

    if (isResolved) {
      complaint.citizenVerified = true;
      complaint.verifiedAt = new Date().toISOString();
    } else {
      complaint.status = 'In Progress';
      complaint.citizenVerified = false;
      complaint.reopenedAt = new Date().toISOString();
    }

    complaint.updatedAt = new Date().toISOString();
    return res.json(complaint);
  });

  // Mount Vite middleware in development or static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Report2Resolve server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
