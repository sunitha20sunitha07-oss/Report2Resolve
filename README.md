# Report2Resolve

> **"From reporting a problem to verified resolution."**

Report2Resolve is an AI-powered citizen problem reporting and resolution platform for the Google Hackathon. It empowers citizens to voice public service grievances in everyday language (Tamil, English, Tanglish), accurately understands the core problem using **Google Gemini AI**, classifies the complaint, determines urgency, and routes it to the designated municipal department.

---

## Phase 2: Real Gemini AI Complaint Understanding

Phase 2 replaces the initial placeholder with a real-time **Google Gemini 3.8 Flash** pipeline using the official Google Gemini SDK (`@google/generative-ai`):

- **Multilingual Understanding:** Accurately processes Tamil script (e.g., `"எங்க தெருவுல மூணு நாளா street light எரியல."`), English, and Tanglish.
- **Structured JSON Schema:**
  ```json
  {
    "problem": "Street light is not working",
    "category": "Street Lighting / Electrical",
    "priority": "Medium",
    "department": "Municipal Electrical Department"
  }
  ```
- **Supported Civic Categories:**
  - `Roads / Potholes`
  - `Street Lighting / Electrical`
  - `Water Supply`
  - `Sanitation / Waste`
  - `Drainage`
  - `Public Transport`
  - `Public Safety`
  - `Government Services`
  - `Other`
- **Priority Logic:**
  - **Critical:** Immediate danger to life or major public safety risk.
  - **High:** Serious issue requiring quick municipal attention.
  - **Medium:** Normal civic issue that should be addressed.
  - **Low:** Minor/non-urgent issue.
- **Department Routing:** Suggests the appropriate civic department (e.g. *Municipal Electrical Department*, *Public Works Department (PWD)*, *Water Supply & Sewerage Board (TWAD / Metro Water)*, *Corporation Health & Sanitation*).
- **Zero Mocking:** No fake or simulated AI responses. Displays loading skeletons, parsed Gemini results, or clear error handling with retry capability.

---

## API Key Security & Configuration

To prevent hard-coding sensitive keys:

### Option A: Local `.env.local` File (Recommended for Dev)
Create a `.env.local` file inside `Report2Resolve/`:
```bash
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```
*(This file is excluded in `.gitignore` and won't be committed to Git).*

### Option B: In-App API Key Manager (Instant Browser Setup)
Click the **"Set Gemini Key"** / **"Gemini Key Active"** badge in the top navigation bar. Paste your key to save it in browser `localStorage`. You can clear or update it anytime.

Get a free key from: [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Project Structure

```text
Report2Resolve/
├── public/
│   └── favicon.svg                  # Civic shield emblem
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Navigation bar & Gemini key status badge
│   │   ├── LandingHero.jsx          # Landing page with tagline & 5-step lifecycle
│   │   ├── ComplaintForm.jsx        # Grievance input form, Tamil sample, voice placeholder
│   │   ├── AnalysisResultsCard.jsx  # Structured AI output display with real Gemini data & priority badges
│   │   ├── ApiKeyModal.jsx          # Secure in-app Gemini API key settings dialog
│   │   └── Footer.jsx               # Civic footer
│   ├── services/
│   │   └── aiService.js             # Google Gemini SDK integration layer & JSON parser
│   ├── App.jsx                      # Root container & modal/page state manager
│   ├── main.jsx                     # React entrypoint
│   └── index.css                    # Tailwind CSS directives
├── .env.example                     # Environment template
├── .gitignore                       # Excludes .env, node_modules, and build outputs
├── index.html                       # HTML5 template
├── package.json                     # Project manifest and scripts
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.js               # Theme configuration
├── vite.config.js                   # Vite configuration (port 3000)
└── README.md                        # Documentation
```

---

## How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm.cmd install
   ```

2. **Start Dev Server:**
   ```bash
   npm.cmd run dev
   ```

3. **Open App in Browser:**
   ```
   http://localhost:3000
   ```

4. **Verify:**
   - Click "Report a Problem".
   - Click "Insert Example" on the Tamil prompt (`"எங்க தெருவுல மூணு நாளா street light எரியல."`).
   - Click **"Analyze Complaint"** to see Gemini analyze the grievance live!
