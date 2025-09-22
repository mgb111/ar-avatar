# AR Avatar (Frontend) + Backend Proxy

This project splits the public frontend (suitable for GitHub Pages) from a secure backend proxy that holds your OpenAI API key.

Frontend lives at the repo root (e.g., served by GitHub Pages). Backend lives in `backend/` and can be deployed to any Node host (Railway, Render, Fly.io, Vercel, etc.).

## Why a backend proxy?
- Never expose `OPENAI_API_KEY` in `index.html` or client JavaScript.
- Browsers are public; any embedded key will be stolen and likely blocked.
- The frontend instead calls your backend proxy, which talks to OpenAI securely.

## Files
- `index.html`: Three.js + WebXR AR avatar with speech and TTS. Uses `BACKEND_URL` instead of OpenAI directly.
- `avatar.glb`: Default avatar model.
- `backend/`: Node.js server exposing `/api/chat` and `/api/tts`.

## Configure Frontend
1. Open `index.html` and set:
   ```js
   const BACKEND_URL = 'https://your-backend.example.com';
   ```
   Use your deployed backend URL. For local dev, use `http://localhost:3000`.

2. Commit and push to GitHub. Serve the repo root via GitHub Pages.

## Backend Setup (Local Dev)
1. Create `backend/.env` with your key (do NOT commit this):
   ```ini
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PORT=3000
   ```
2. Install dependencies and run:
   ```bash
   # from the backend directory
   npm install
   npm run dev
   ```
3. In `index.html`, set:
   ```js
   const BACKEND_URL = 'http://localhost:3000';
   ```

## Backend Endpoints
- `POST /api/chat`
  - Request JSON: `{ systemPrompt?: string, userPrompt: string, model?: string }`
  - Response JSON: `{ text: string }`

- `POST /api/tts`
  - Request JSON: `{ text: string, voice?: string, model?: string }`
  - Response: `audio/mpeg` body

## Deploy Backend
- Railway/Render/Fly.io: Create a new service from `backend/`.
  - Set environment variable `OPENAI_API_KEY`.
  - Ensure Node 18+.
- Vercel: Create a Node server or convert to serverless functions as desired. If using the provided `server.js`, deploy as a standalone Node app (Hobby) or adapt endpoints to API routes.

After deployment, update `BACKEND_URL` in `index.html` to your backend URL.

## Important Security Notes
- Remove any `.env` at the repo root that contains secrets. Keep secrets only in `backend/.env` or the host's env settings.
- `.gitignore` already ignores `backend/.env` and `backend/node_modules/`.

## Troubleshooting
- If the debug panel in `index.html` shows "Backend: Missing BACKEND_URL", set the constant at the top of the module.
- If TTS or chat fails, open DevTools Network tab and inspect `/api/*` responses from your backend.
- CORS: The backend currently allows `*`. Tighten `origin` for production.
