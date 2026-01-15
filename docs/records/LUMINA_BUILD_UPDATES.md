# LUMINA Build Updates (Running Record)

Last updated: 2026-01-12  
Repo: `/Users/quanho/lumina`

**Purpose:** This document is a durable handoff / continuity record. Start here in new chats to understand:
- what has been implemented so far
- where key logic lives (files + routes)
- what remains to be verified or improved

---

## High-level outcomes so far

- **Dashboard UX modernization**: Apple-inspired glassmorphism for the Intelligence Feed and improved loading/analysis states.
- **No “recommendations layer”**: removed BUY/SELL/HOLD, “Opportunity Scores”, star ratings, and “go/no-go” framing; replaced with decision-support primitives.
- **Agent rigor upgrade**: tiered epistemic framework (Tier 0 kernel, Tier 1 domain critique modules, Tier 2 Sonny synthesis protocol) to reduce hallucination and enforce evidence discipline.
- **Per-article Intelligence analysis**: structured, persona-aware Sonny analysis on-demand with caching.
- **Follow-up chat fixed**: individual agent “Ask Follow-up Questions” now calls a real backend endpoint in Live mode.

---

## Current AI stack (at-a-glance)

### Runtime + app
- **Frontend**: React + Vite + TypeScript
  - Vite proxy: `vite.config.ts` routes `/api/*` → local backend (`http://localhost:3001`)
- **Backend (local)**: Express (`server/app.ts`, `server/index.ts`)
- **Backend (deployed)**: Vercel serverless functions (`api/*`)

### Multi-model LLM architecture
Configured in `src/lib/llm/agentConfig.ts` and implemented via `src/lib/llm/*Client.ts` + `src/lib/llm/clientFactory.ts`:
- **Anthropic (Claude)**: clinical, regulatory, target biology, and Sonny synthesis
- **Google (Gemini)**: financial
- **Perplexity**: patent + market research (retrieval-oriented)

### Orchestration + intelligence
- **Orchestrator core**: `src/lib/orchestrationEngine.ts`
- **Local orchestrator route**: `POST /api/agents/orchestrator`
- **Vercel orchestrator route**: `POST /api/orchestrator`
- **Intelligence feed prompts**: `src/lib/intelligence/sonnyIntelligencePrompts.ts`
- **All-agent prompts + epistemic rules**: `src/lib/agentPrompts.ts`, `src/lib/sonnyPrompts.ts`

---

## 2025-12 (Earlier work): Decision-support refactor + epistemic rigor across agents

### What changed conceptually

- **Removed prescriptive outputs** across the dashboard (recommendations, scores, BUY language).
- Replaced with **decision-support primitives**:
  - Decision drivers
  - Key uncertainties
  - Decision triggers / thresholds
  - Verification required
  - Disconfirming evidence / stop conditions
- Implemented a **tiered epistemic framework**:
  - **Tier 0**: global “never guess” rules + required structured output across all agents
  - **Tier 1**: agent-specific critique rubrics (clinical, patent, regulatory, market, financial)
  - **Tier 2**: Sonny synthesis protocol for conflict detection, evidence ceilings, and consolidated verification plan
  - **Tier 2-lite**: lighter ruleset applied specifically to intelligence feed prompts

### Prompt architecture (where it lives)

- **All-agent prompts + Tier 0 + Tier 1**:
  - `src/lib/agentPrompts.ts`
    - Contains the shared Tier 0 kernel and Tier 1 domain critique modules
    - Prepends Tier 0 to every agent prompt and Tier 1 to relevant agents
- **Sonny orchestrator / synthesis protocol (Tier 2)**:
  - `src/lib/sonnyPrompts.ts`
    - Sonny synthesis prompt updated to remove prescriptive recommendation framing
    - Prepended with Tier 0 kernel + Tier 2 synthesis protocol
- **Intelligence feed prompts (Tier 2-lite)**:
  - `src/lib/intelligence/sonnyIntelligencePrompts.ts`
    - Added a Tier 2-lite kernel (never guess, evidence ceilings, conflicts, bundled numbers discipline)
    - Prepended to the single-item and digest prompts + per-article analysis prompt

### UI and data model refactors (recommendations removed)

Key files updated to remove scores/recommendations and reframe content:
- `src/components/sonny/SonnyHeroInterface.tsx` (removed BUY/score UI; added uncertainties/triggers/next steps; upgraded export)
- `src/components/tiles/StrategicRecommendationTile.tsx` (renamed to “Decision Support”, removed recommendation prop)
- `src/components/ScoutDashboard.tsx`, `src/components/ScientistDashboard.tsx` (removed recommendation extraction/mapping)
- `src/components/tiles/ScientificValidationTile.tsx` (replaced star ratings with qualitative “Evidence maturity” tags)
- `src/components/tiles/GeneticValidationTile.tsx` (“Score:” → “Association strength:”; renamed pLI/LOEUF labels)
- `src/components/clinical/DealMemoPanel.tsx` (“Recommendation” → “Decision Framing”)
- `src/lib/tiles/extractors.ts` (stopped extracting `recommendation` fields)
- Tile templates updated to stop rendering recommendation UI:
  - `src/lib/tiles/templates/executiveSummaryTileTemplate.tsx`
  - `src/lib/tiles/templates/agentTileTemplates.tsx`
- Demo text sanitized so demo mode doesn’t leak prescriptive language:
  - `src/lib/mockAgentResponses.ts`
  - `src/lib/demoMultiAgentScenarios.ts` (sanitization applied to every replayed event)
  - `src/components/agents/MultiAgentDemo.tsx` (scenario text reframed)

### Intelligence Feed UX upgrade + per-article analysis

- Glassmorphism UI rebuild:
  - `src/components/views/IntelligenceFeed.tsx`
- Added per-article Sonny analysis endpoint (structured output) + frontend on-demand fetch + caching:
  - Express route: `server/api/intelligence/article-analysis.ts`
  - Vercel serverless: `api/intelligence/article-analysis.ts`
  - Prompt: `src/lib/intelligence/sonnyIntelligencePrompts.ts` (`SONNY_ARTICLE_ANALYSIS_PROMPT`)

### Professional exports (non-markdown output)

- Added “professional structured export” library:
  - `src/lib/professionalExport.ts`

---

## Sonny Side Panel (Hero Skills V2): skill map + implementation plan

### Product intent (from earlier design discussion)

The Sonny side panel is the “demo surface” for each agent. The intent is:
- **2 hero skills per agent** (no complex tabs)
- **Professional, export-ready outputs** (not raw markdown as the primary surface)
- **Consistent UI pattern** across agents (same layout, theming, progressive disclosure)
- **Sonny** as the flagship: executive brief + board-ready decision framing (no “BUY”)

### Where the side panel and hero skills live

- **Panel container**: `src/components/SonnySidePanel.tsx`
  - Manages agent selection, panel resize/collapse, and conditional rendering
  - Uses a feature flag: `USE_HERO_SKILLS` to swap V1 vs V2 interfaces
- **Shared hero skill UI**:
  - `src/components/agents/shared/HeroSkillCard.tsx`
  - `src/components/agents/shared/AgentInterfaceLayout.tsx`
  - `src/components/agents/shared/FutureAnalysisDropdown.tsx`
  - `src/components/agents/shared/DocumentUploadZone.tsx`
- **V2 interfaces (Hero Skills)**:
  - `src/components/clinical/ClinicalAgentInterfaceV2.tsx`
  - `src/components/patent/PatentAgentInterfaceV2.tsx`
  - `src/components/financial/FinancialAgentInterfaceV2.tsx`
  - `src/components/market/MarketResearchAgentInterfaceV2.tsx`
  - `src/components/regulatory/RegulatoryAgentInterfaceV2.tsx`
  - `src/components/target-biology/TargetBiologyAgentInterfaceV2.tsx`
- **Sonny flagship hero interface**:
  - `src/components/sonny/SonnyHeroInterface.tsx`
    - Uses structured export via `src/lib/professionalExport.ts`
    - Updated to decision-support framing (uncertainties / triggers / next steps)

### Current “Hero Skills” per agent (as implemented / defined)

Source-of-truth for the intended skill map: `docs/agents/AGENT_HERO_SKILLS_IMPLEMENTATION_PLAN.md`

- **Clinical**
  - Trial Landscape Analyzer
  - Clinical Validation Score (now framed as evidence maturity / risk signals, not a “go/no-go” score)
- **Patent**
  - FTO Risk Assessment
  - Patent Landscape Map
- **Financial**
  - Deal Comparables Analysis
  - Revenue Forecast Model (probability-weighted assumptions; decision-support, not a valuation “recommendation”)
- **Market Research**
  - Market Sizing Analysis (TAM/SAM/SOM with explicit assumptions + evidence ceilings)
  - Competitive Positioning Matrix
- **Regulatory**
  - Approval Pathway Advisor (framing / constraints, not a “recommendation”)
  - Expedited Designation Eligibility
- **Target Biology**
  - Expression Profile Analysis
  - Genetic Validation Score (reframed as evidence strength + gaps)
- **Sonny**
  - Executive Target Brief (multi-agent synthesis → decision drivers / uncertainties / triggers)
  - Investment Thesis Generator (reframed as board-ready framing, not “BUY”; includes bull/bear, risks, and verification plan)

### Current status (important)

- **UI/UX layer**: Hero Skills V2 components exist and render.
- **Sonny flagship output**: `SonnyHeroInterface.tsx` is already migrated to **professional structured export**.
- **But** several specialist V2 interfaces still call **placeholder agent endpoints** that do not exist in Live mode (example: `PatentAgentInterfaceV2.tsx` calls `POST /api/agents/patent-expert`).
  - Result: those hero skill buttons (and chat inside those V2 interfaces) will fail until the backend routes are wired.

### Implementation plan to “make the skills real”

**Goal:** Each hero skill should trigger a reliable backend workflow that returns **structured JSON** (canonical), which can then render:
- a crisp on-screen result
- a professional export (PDF/DOCX/HTML/JSON)
- optional tiles

Recommended engineering approach:

1. **Create a single-agent execution endpoint** (in addition to orchestration)
   - Add something like `POST /api/agents/run` (Express + Vercel) that accepts:
     - `agentType`
     - `analysisType` (maps to “hero skill”)
     - `targetName` / context fields
     - `documents` (optional)
     - `input` or `messages`
   - Implementation should reuse:
     - `AGENT_MODEL_CONFIG` + `AGENT_PROMPTS` + `createLLMClient`
     - Tier 0/1 rules already embedded in prompts
   - Return `{ resultJson, narrative?, citations?, provider, model }`

2. **Update each V2 interface to call the single-agent endpoint**
   - Replace `/api/agents/*-expert` placeholders with `/api/agents/run`.
   - Keep `POST /api/agents/chat` for lightweight follow-up Q&A OR route follow-ups through `/api/agents/run` with `analysisType: 'followup'`.

3. **Define per-skill structured output contracts**
   - Each hero skill returns a stable JSON schema with:
     - Key claims (with [P]/[R]/[U]/[H] tags)
     - Evidence quality table
     - Uncertainties + verification required
     - Domain-specific sections (e.g., FTO blockers, designation criteria)
   - Avoid free-form markdown as the primary contract; use it only as a rendering convenience when needed.

4. **Professional export parity**
   - Extend the `StructuredDocument` model in `src/lib/professionalExport.ts` to cover agent-specific exports.
   - Ensure each hero skill can export:
     - PDF (HTML → print)
     - DOCX (HTML)
     - JSON (canonical)

### Carry-forward tasks (Sonny side panel)

- Wire specialist V2 hero skills to real backend execution (remove placeholder endpoints).
- Ensure “follow-up chat” in V2 interfaces uses the new `/api/agents/chat` (or `/api/agents/run`) consistently.
- Define and implement structured output schemas for each hero skill (per agent).
- Upgrade each agent’s export to structured document parity (match Sonny).

---

## 2025-12-21 (This session): Live analysis UI polish + individual agent follow-up chat fix

### A) Fix “Analyzing…” animation / rendering in the analysis header tile

**Problem:** The analysis header UI could appear “dead” at start (0% width + no events yet).

**Fix (implemented in UI):**
- Polished the header card styling to match the dashboard (glass + `rounded-2xl`, richer shadow).
- Ensured the progress UI animates immediately:
  - clamped visible percent to ≥ 1%
  - clamped progress fill width to ≥ 6% while running
  - added subtle shimmer/pulse overlay on the track
  - added “Initializing orchestration…” spinner row before agent events arrive

**File edited:**
- `src/components/agents/MultiAgentCollaboration.tsx`

### B) Make “Ask Follow-up Questions” functional in Live mode

**Problem:** The follow-up chat UI was calling non-existent endpoints like `/api/agents/patent-expert` → fetch failed → generic error in chat.

**Fix approach:** Standardize to a single route:
- `POST /api/agents/chat` with `{ agentType, messages, documents }`

**Frontend changes:**
- `src/components/agents/MultiAgentCollaboration.tsx`
  - Added agent name → `agentType` mapping
  - Updated chat send to call `/api/agents/chat`
  - Improved error handling (read response text)

**Backend (local Express) changes:**
- `server/api/agents/index.ts`
  - Added `POST /api/agents/chat`
  - Uses existing LLM stack: `AGENT_MODEL_CONFIG` + `AGENT_PROMPTS` + `createLLMClient`
  - Adds a small “Follow-up Q&A mode” addendum (no invention, “NOT ASSESSABLE”, decision-support framing)

**Backend (Vercel serverless) additions:**
- `api/agents/chat.ts`

**Build verification done:**
- `npm run build` passed after changes.

---

## How to run locally

Run frontend + backend together:
- `npm run dev:all`

Notes:
- `vite.config.ts` proxies `/api/*` → `http://localhost:3001`

---

## What still needs to be done (carry-forward checklist)

- **Deploy + verify on Vercel**:
  - Confirm `POST /api/agents/chat` works in deployed Live mode
  - Confirm auth expectations (Express uses `isAuthenticated`; serverless handler currently does not)
- **Follow-up chat grounding (recommended)**:
  - Send richer context than `context.substring(0, 500)` (or include structured tile fields/evidence)
- **Make follow-up chat mapping more robust (recommended)**:
  - Store `agentType` explicitly on `AgentActivity` (avoid brittle string matching)
- **Improve debug UX in dev (optional)**:
  - Show HTTP status / backend error payload in dev mode instead of a generic message

---

## Quick route reference

- **Orchestrator (local Express)**: `POST /api/agents/orchestrator`
- **Orchestrator (Vercel)**: `POST /api/orchestrator`
- **Individual follow-up chat (local Express + Vercel)**: `POST /api/agents/chat`
- **Intelligence per-article analysis (local Express + Vercel)**: `POST /api/intelligence/article-analysis`

---

## Trust stack contracts (BD/scientist)

- Canonical schemas for claim-first, evidence-backed outputs:
  - `docs/trust/DILIGENCE_TRUST_STACK_SCHEMAS.md` (Claim Ledger, Retrieval Log, Verification Plan, Sonny derived synthesis view)

## Trust layer backlog (epics → stories → acceptance criteria)

- Implementation backlog aligned to the contracts above:
  - `docs/trust/TRUST_LAYER_IMPLEMENTATION_BACKLOG.md`
  - Backlog v0.4 includes: drug/condition/company extraction + disambiguation, trial results retrieval, packet sizing controls, caching/dedup + error recovery, **rate limiting coordination**, retraction checks + conflict resolution, narrative generator, persistence (file→DB) + permissions model, export integrity/signatures, cost management, rollout/feature flags/monitoring + **source health monitoring**, **run history search/filter**, and optional batch processing.
  - Week 1 execution plan:
    - `docs/trust/TRUST_LAYER_SPRINT_PLAN_WEEK1.md`
  - Week 2 execution plan:
    - `docs/trust/TRUST_LAYER_SPRINT_PLAN_WEEK2.md`

---

## 2026-01-12: Critical due diligence review (BD/licensing + scientist) + next-phase plan

### Executive verdict (client lens)

- **Not yet as a paid enterprise diligence product**, but close: currently a sophisticated demo with strong architecture/prompt discipline.
- **Primary blocker**: trust infrastructure (provenance + retrieval + verification + auditability) must be enforced at the system level, not only requested in prompts.
- **Time to “basic paid”**: ~3–6 months with focused execution on trust + workflow primitives (not more agents).

### Strengths (keep / double down)

- **Citation protocol + epistemic discipline**: Tier 0/1/2 prompting is ahead of most “AI DD” products.
- **Multi-LLM strategy**: provider selection by task profile is strategically sound.
- **Multi-agent orchestration**: domain separation + synthesis is a strong differentiator.
- **Decision-support framing**: removing recommendation/score layer reduces risk and matches real diligence.

### Weaknesses (must fix for adoption)

- **Data gap / placeholder retrieval**: user-facing experience still feels like “LLM says…” in places; retrieval is not consistently injected and audited.
- **No enforced verification layer**: citations are not systematically validated; numbers can still drift/hallucinate.
- **Insufficient trust signaling**: UI lacks at-a-glance tier badges, “last verified”, claim-level evidence chips.
- **No human-in-the-loop**: lacks accept/edit/reject + annotation + lock workflow for high-stakes review.
- **Limited repeatability/auditability**: needs run history, model/prompt/source versioning, and diff between runs.

### Product positioning (near-term)

- v1.0: “AI-assisted research accelerator” (demo/early users) — still heavy manual verification.
- v1.5: “BD/scientist evidence pack + verification plan” (small teams) — credible if provenance is enforced.

### Minimum Lovable Trust Stack (for BD/licensing + scientist)

**What we sell:** a diligence-ready **Evidence Pack** (not just narratives).

Every run should produce:
- **Executive brief**: decision drivers, key risks, top uncertainties, decision triggers, next steps
- **Claim ledger** (canonical): atomic claims with evidence refs + evidence class + confidence ceiling
- **Retrieval logs** (canonical): what was searched, where, when, what returned, limitations
- **Verification plan** (canonical): BD-style “data room request list” mapped to uncertainties + unlocks

Contracts defined in: `docs/trust/DILIGENCE_TRUST_STACK_SCHEMAS.md`

### RAG strategy (yes — but “just-in-time”, structured, source-tiered)

Avoid “vectorize the universe”. Instead:
- **Entity extraction** → **targeted retrieval** (authoritative APIs) → **structured JSON packet** → **constrained generation** → **post-gen verification** → **trust UI**

Priority authoritative sources (Phase 1):
- ClinicalTrials.gov v2
- PubMed E-utilities
- Drugs@FDA / labels
Then:
- UniProt / OpenTargets / gnomAD for biology
- USPTO/Google Patents/PatentsView for IP (start “light + provable”)

### Verification layer (enforcement)

Implement two passes:
1. **Citation existence validation** (PMID/NCT/URLs resolve and match expected source type)
2. **Source divergence checks** for key numeric/date fields (flag mismatch; downgrade claim to [U] unless reconciled)

### UI trust primitives (quick wins)

- Tier badge per claim (Tier 1/2/3)
- `[P]/[R]/[U]/[H]` chips per claim
- “Last verified” timestamp on citations
- Evidence drawer: excerpt + locator + “view source”
- Banner: “X claims flagged” with triage view

### Human-in-the-loop (enterprise safety valve)

- Review queue of flagged claims: **Accept / Edit / Reject**
- Store annotations with author/time/rationale + linked evidence
- Lock approved sections to prevent drift
- Export includes approvals + change log

### Next-phase development plan (no code changes in this discussion)

**Phase 1 (Weeks 1–4): Basic Trust Layer (v1.5)**
- Source connectors: CT.gov + PubMed + Drugs@FDA (with caching + timestamps)
- Emit canonical artifacts: Claim Ledger + Retrieval Logs + Verification Plan
- Verification v1: citation existence + URL validation
- UI v1: tier badges + last verified + evidence drawer

**Phase 2 (Weeks 5–8): Verification Layer (v2.0-lite)**
- Divergence checks for numeric/date fields from structured sources
- Validator agent “self-audit” + deterministic consistency checks
- Export upgrade: methodology + source inventory + verification summary

**Phase 3 (Weeks 9–12): HITL + versioning**
- Claim accept/edit/reject workflow + annotations + locking
- Run history (prompt/model/source versions) + diff between runs
- BD workflow templates: data room request packs + diligence checklists

### Explicit “don’ts” (to stay focused)

- Don’t add more agents right now.
- Don’t over-optimize prompts until verification + provenance are enforced.
- Don’t build a massive general-purpose vector DB; prefer just-in-time targeted retrieval.

