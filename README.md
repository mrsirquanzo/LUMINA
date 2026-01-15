# LUMINA — Biotech Intelligence Dashboard

LUMINA is a biotech diligence dashboard built around a multi-agent workflow (Sonny + specialists). The product direction emphasizes **decision support** (drivers, uncertainties, triggers, verification) over prescriptive “BUY/SELL” recommendations, with evidence-disciplined prompting and room for a system-level trust layer.

## Quick start

```bash
npm install
npm run dev:all
```

- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:3001` (Express API; required for Sonny/agents)

More details: `docs/getting-started/START_GUIDE.md`

## Repository layout

- `src/`: React app (dashboards, tiles, Sonny side panel, Intelligence Feed)
- `server/`: local Express backend (dev/runtime API)
- `api/`: Vercel serverless functions (deployed API)
- `docs/`: product + engineering documentation
- `mockups/`: static HTML prototypes (not used by the build)

## Documentation index (start here)

- **Getting started**: `docs/getting-started/START_GUIDE.md`
- **Running record (handoff)**: `docs/records/LUMINA_BUILD_UPDATES.md`
- **Trust layer**: `docs/trust/TRUST_LAYER_IMPLEMENTATION_BACKLOG.md`, `docs/trust/TRUST_LAYER_SPRINT_PLAN_WEEK1.md`, `docs/trust/TRUST_LAYER_SPRINT_PLAN_WEEK2.md`
- **Agents**: `docs/agents/` (hero skills, integration status, domain reviews)
- **Deployment**: `docs/deployment/`
- **Dashboard / UX**: `docs/dashboard/`
- **Tiles**: `docs/tiles/`
- **Patent parsing**: `docs/patent-parsing/`
- **Exports**: `docs/export/PDF_EXPORT_GUIDE.md`
- **Investment memo**: `docs/investment-memo/`
- **MCP (retrieval layer)**: `docs/mcp/`

## Tech stack

- **Frontend**: React 19, TypeScript, Vite, React Router, Tailwind CSS, TanStack Query, Zustand, Framer Motion
- **Backend**: Express (local), Vercel serverless functions (deployed)
- **LLMs**: Anthropic Claude, Google Gemini, Perplexity (see `docs/records/LUMINA_BUILD_UPDATES.md` for current routing)

## License

Private project
