# Vercel Deployment Guide

## Quick Start

### 1. Create GitHub Repository
```powershell
# Create new repo on https://github.com/new
# Then add remote:
git remote add origin https://github.com/YOUR_USERNAME/your-repo-name.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
- Visit https://vercel.com/new
- Click "Import Git Repository"
- Paste your GitHub repo URL
- Vercel auto-detects the monorepo (frontend + backend)
- Click "Deploy"

### 3. Configure Environment Variables in Vercel
In Vercel Project Settings → Environment Variables, add:

**For Ollama (Local):**
- `OLLAMA_URL`: `http://localhost:11434` (if using local Ollama tunnel)

**For Production:**
- `OLLAMA_URL`: Set to your Ollama production server
- `OPENAI_API_KEY`: If using OpenAI instead of Ollama
- `GROK_API_KEY`: If using Grok

### 4. Vercel Project Structure
```
project/
├── frontend/          → Deployed as static site
├── backend/
│   └── api/index.ts   → Deployed as serverless functions (/api)
├── vercel.json        → Root configuration
└── README.md
```

### 5. URLs After Deployment
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-project.vercel.app/api/llm/test-connection`
- **Frontend automatically routes to `/api` for all API calls**

## Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Ensure `npm install` can complete in backend/
- Verify TypeScript compiles: `npm run build` in both frontend/ and backend/

**API calls fail in production?**
- Frontend already configured to use `/api` (no CORS issues)
- Check Vercel environment variables are set
- Verify backend can access Ollama/external services

**Ollama connection fails?**
- Local Ollama won't be accessible from Vercel cloud
- Use cloud Ollama service or set up a tunnel
- Update `OLLAMA_URL` environment variable
