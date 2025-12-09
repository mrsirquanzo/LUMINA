# 🚀 LUMINA Quick Start Guide

## Starting the Application

LUMINA requires **TWO servers** to run:

### Option 1: Start Both Together (Recommended)

```bash
npm run dev:all
```

This starts:
- **Frontend** on `http://localhost:5173` (Vite)
- **Backend** on `http://localhost:3001` (Express API)

### Option 2: Start Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run dev:server
```

## What Each Server Does

### Frontend (Port 5173)
- The LUMINA dashboard UI
- React + Vite application
- Handles all user interface

### Backend (Port 3001)
- Sonny agent API endpoints
- File upload processing
- LLM API calls (Claude, Gemini, Perplexity)
- **Required for Sonny agents to work!**

## Troubleshooting

### ❌ "localhost refused to connect"
**Problem:** The frontend server isn't running.

**Solution:**
```bash
npm run dev
```

### ❌ Sonny panel shows errors
**Problem:** The backend server isn't running.

**Solution:**
```bash
npm run dev:server
```

Or start both together:
```bash
npm run dev:all
```

### ❌ "API key not configured"
**Problem:** Missing API keys in `.env` file.

**Solution:**
1. Copy `.env.example` to `.env`
2. Add your API keys:
   - `ANTHROPIC_API_KEY` (Claude)
   - `GOOGLE_API_KEY` (Gemini)
   - `PERPLEXITY_API_KEY` (Perplexity)

### ✅ Verify Everything is Running

Check if servers are running:
```bash
# Check frontend (port 5173)
curl http://localhost:5173

# Check backend (port 3001)
curl http://localhost:3001/api/health
```

## Using Sonny

1. **Open LUMINA:** Go to `http://localhost:5173`
2. **Find Sonny Panel:** Right-side panel (expand if collapsed)
3. **Ask a Question:** Type your query in the panel
4. **Watch Agents Work:** See real-time analysis from all 5 agents

## Keyboard Shortcuts

- `⌘+K` or `Ctrl+K`: Focus search in Header
- `⌘+J` or `Ctrl+J`: Toggle Sonny panel
- `⌘+Enter` or `Ctrl+Enter`: Start analysis in Sonny panel

## Need Help?

If you're still having issues:
1. Check browser console (F12) for errors
2. Check terminal output for server errors
3. Verify both servers are running on correct ports
4. Ensure `.env` file has all API keys
