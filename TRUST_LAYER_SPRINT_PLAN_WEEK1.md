# Trust Layer — Week 1 Sprint Plan (BD/licensing + scientist)

Sprint window: Week 1 (5 working days)  
Inputs:
- `TRUST_LAYER_IMPLEMENTATION_BACKLOG.md` (v0.4)
- `DILIGENCE_TRUST_STACK_SCHEMAS.md` (contracts v0.1)

Objective: deliver a **vertical slice** of the trust layer that proves the core loop:

> Query → entity extraction → authoritative retrieval → EvidencePacket (sized + cached) → persisted run artifacts → (optional) constrained agent call behind feature flag

No new agents. No prompt polishing beyond enforcing “cite from packet / otherwise [U]”.

---

## Success criteria (end of Week 1 demo)

Given a query like:
- “What is the current status and primary endpoints for NCT02588612?”
- “Tell me about pembrolizumab in melanoma”

We can:
1. Extract key entities (NCT/PMID + drug + condition + company candidates).
2. Retrieve authoritative records (CT.gov + PubMed) with logs and timestamps.
3. Build an **EvidencePacket** that:
   - stays within size limits (TL‑1.2)
   - is deduped within-run (TL‑1.6)
   - survives partial failures (TL‑1.7)
   - respects provider quotas (TL‑1.8; single-process v0)
4. Persist artifacts to disk (local dev) via **fileStore** (TL‑11.1).
5. Provide simple **dev inspection endpoints** to fetch the latest run + artifacts without hunting the filesystem.
5. (Optional but strongly preferred) invoke the clinical agent with packet injection behind a feature flag and obtain a response that references packet evidence IDs (even if narrative remains).

---

## In scope (Week 1)

### Retrieval + packet foundation
- TL‑1.1 (entity extraction expanded to drug/condition/company) — v1
- TL‑1.1b (basic disambiguation/linking) — v0 (minimal)
- TL‑1.2 (EvidencePacket builder + size controls) — v1
- TL‑1.3 (CT.gov + PubMed retrieval via MCP) — v1
- TL‑1.6 (within-run cache + dedup) — v1
- TL‑1.7 (error handling + recovery) — v1
- TL‑1.8 (rate limiting coordination) — v0 (single-process; shared quota model deferred)

### Persistence (local dev)
- TL‑11.1 (file-based persistence + atomic writes) — v1

### Rollout switches (minimal)
- TL‑10.1 subset:
  - `ENABLE_RAG_RETRIEVAL`
  - `ENABLE_PERSISTENCE_FILE`

---

## Out of scope (Week 1)

- DB persistence (TL‑11.2)
- HITL workflows + permissions enforcement (TL‑5.0+)
- Divergence validation and retraction checks (TL‑3.x)
- Trust UI primitives (TL‑4)
- Export signatures (TL‑6.4)
- Batch queue/notifications (TL‑12)
- Source health monitoring + status page (TL‑10.4)
- Run history search/filter (TL‑6.5)
- Full biology retrieval (TL‑1.4) — can begin in Week 2 once packet core is stable

---

## Sprint backlog (top stories)

### Story W1‑1 — Define EvidencePacket + run artifact layout
**Maps to:** TL‑1.2, TL‑11.1, TL‑0.2  
**Why now:** everything else depends on stable structure.

**Tasks**
- Define `EvidencePacket` interface (align with contracts):
  - `asOf`, `retrievalLogs[]`, `evidence[]`, `sources{...}`, `limitations[]`
- Define run artifact directory structure + naming.
- Decide where runs live in dev (e.g., `./.lumina/runs/{runId}/...`).

**Acceptance tests**
- Create a sample packet JSON that passes basic schema checks and is readable.
- Run folder contains the 4 required artifact files (even stubbed).

---

### Story W1‑2 — Entity extraction v1 (IDs + drug/condition/company candidates)
**Maps to:** TL‑1.1, TL‑1.1b  
**Why now:** retrieval quality collapses without drug/indication/company.

**Tasks**
- Deterministic extraction:
  - NCT IDs, PMIDs, DOI
- Drug candidates:
  - heuristic suffix detection (`-mab`, `-nib`, `-zumab`, etc.) → **candidates**
  - confirm via lookup where possible (ChEMBL preferred; if not ready, keep as candidate with low confidence)
- Condition candidates:
  - simple dictionary starter (oncology high-frequency list) + user-provided indication override
- Company candidates:
  - heuristic capitalization + common suffixes (Inc, Ltd, Pharma) + doc text scan
- Disambiguation v0:
  - gene-word collisions: maintain a denylist and mark as ambiguous unless confirmed by retrieval

**Acceptance tests**
- Query “pembrolizumab melanoma” extracts:
  - drugCandidates includes “pembrolizumab”
  - conditionCandidates includes “melanoma”
- Query “NCT02588612 results” extracts:
  - nctIds includes “NCT02588612”

---

### Story W1‑3 — Clinical retrieval v1 (CT.gov + PubMed) + logs
**Maps to:** TL‑1.3  
**Why now:** first authoritative grounding.

**Tasks**
- If NCT present → retrieve trial details (CT.gov v2 via MCP `get_trial_details`).
- If no NCT → search CT.gov with derived condition/drug (MCP `search_clinical_trials`).
- PubMed:
  - search query using drug + condition + (optional) NCT string
  - include esummary metadata in packet
- Emit `RetrievalQuery` logs with:
  - executedAt, tool/source, query text/filters, top results, limitations/errors

**Acceptance tests**
- Packet includes at least one CT.gov trial record or a clear “no results found” with limitations.
- Packet includes PubMed articles or clear “no articles found”.

---

### Story W1‑4 — PacketSizer v1 (limits + truncation + overflow reporting)
**Maps to:** TL‑1.2 (expanded)  
**Why now:** prevents prompt blowups and unpredictable costs.

**Tasks**
- Implement prioritization rules:
  - exact ID matches always included
  - direct lookups > search results
  - tier > recency > relevance
- Implement truncation rules:
  - sentence boundary truncation
  - `[truncated …]` markers
- Produce `limitations[]` entries when trimming occurs.

**Acceptance tests**
- For artificially large retrieval sets, packet still:
  - stays under configured caps
  - records “retrieved X, included Y”

---

### Story W1‑5 — Rate limiting v0 + evidence cache/dedup v1 + error recovery
**Maps to:** TL‑1.6, TL‑1.7, TL‑1.8  
**Why now:** makes the system usable (speed + resilience) and prevents quota exhaustion/bans.

**Tasks**
- Rate limiter v0 (single-process):
  - implement a centralized token bucket per provider/source (PubMed, CT.gov) with configurable RPS
  - add a priority parameter (interactive vs batch) even if batch is not in Week 1 (future-proof)
  - integrate into retrieval connectors (before any external call)
- In-run cache:
  - don’t fetch the same NCT/PMID twice across agents
- Persistent cache (dev):
  - reuse `src/lib/utils/biology/cache.ts` patterns where possible
- Error handling:
  - timeouts + retries for transient errors
  - continue with partial evidence and record failures in retrieval logs

**Acceptance tests**
- Re-running the same query within TTL avoids repeated external calls (log shows cache hit).
- If PubMed fails, CT.gov results still appear and the run completes with warnings.
- Burst test (dev): issuing many PubMed calls in a tight loop does not exceed configured RPS; limiter schedules or throttles gracefully (no repeated upstream 429s).

---

### Story W1‑6 — FileStore v1 (durable artifacts)
**Maps to:** TL‑11.1  
**Why now:** HITL/audit trail cannot exist without durable storage.

**Artifact naming convention (for dev endpoints)**
- `evidence-packet` → `evidence-packet.json`
- `claim-ledger` → `claim-ledger.json`
- `verification-report` → `verification-report.json`
- `verification-plan` → `verification-plan.json`
- `audit-log` → `audit-log.jsonl` (stream/line-delimited; endpoint may return last N lines or full file in dev)

**Tasks**
- Implement file store API:
  - `createRun()`, `writeArtifact()`, `appendAuditEvent()`, `finalizeRun()`, `cleanupExpiredRuns()`
- Use atomic writes.
- Add retention cleanup (30 days configurable).
- Add dev-only inspection endpoints (read-only):
  - `GET /api/trust/runs/latest` → returns latest `runId` + metadata
  - `GET /api/trust/runs/:runId` → returns run manifest (what artifacts exist)
  - `GET /api/trust/runs/:runId/artifacts/:name` → returns JSON artifact by name (e.g., `evidence-packet`)
  - Gate behind `NODE_ENV=development` (or a `ENABLE_TRUST_DEV_ENDPOINTS` flag).

**Acceptance tests**
- On run completion, folder contains:
  - evidence-packet.json
  - claim-ledger.json (can be stub for Week 1)
  - verification-report.json (stub OK Week 1)
  - verification-plan.json (stub OK Week 1)
  - audit-log.jsonl
- Hitting `GET /api/trust/runs/latest` returns the run id created by the most recent run.
- Fetching `GET /api/trust/runs/:runId/artifacts/evidence-packet` returns the same JSON as the file on disk.

---

### Story W1‑7 (Stretch) — Orchestration injection behind feature flag
**Maps to:** TL‑1.5, TL‑10.1  
**Why:** proves end-to-end behavior early.

**Tasks**
- If `ENABLE_RAG_RETRIEVAL=true`:
  - build packet once per run
  - inject bounded JSON into the clinical agent call (system prompt wrapper or user message)
- Add hard instruction:
  - “Only cite evidence IDs from the packet; otherwise mark [U]”
- Persist the packet regardless of whether the agent call succeeds.

**Acceptance tests**
- With flag OFF: behavior unchanged.
- With flag ON: agent response references packet evidence IDs or explicitly outputs [U] for missing items.

---

## Daily plan (recommended sequencing)

- **Day 1:** W1‑1 + W1‑2 skeletons (packet interface + entity extraction v1)
- **Day 2:** W1‑3 (CT.gov + PubMed retrieval) + retrieval logs
- **Day 3:** W1‑4 (PacketSizer) + W1‑5 (rate limiter + cache)
- **Day 4:** W1‑6 (FileStore) + integrate persistence into run flow
- **Day 5:** W1‑7 stretch (orchestration injection) + demo hardening

---

## Demo script (end of sprint)

1. Run query: “What is the status and primary endpoints for NCT02588612?”
2. Show extracted entities (IDs + candidates).
3. Show retrieved CT.gov trial details + PubMed metadata.
4. Show packet sizing summary (retrieved vs included).
5. Show persisted artifacts in run folder (with timestamps).
6. (Dev UX) Fetch the latest evidence packet via `GET /api/trust/runs/latest` → `GET /api/trust/runs/:runId/artifacts/evidence-packet`.
6. Toggle `ENABLE_RAG_RETRIEVAL` on/off and demonstrate behavioral difference (if stretch completed).

---

## Key risks (Week 1) and mitigations

- **Drug/condition extraction false positives**
  - Mitigation: treat as candidates with confidence; don’t elevate to facts until retrieval confirms.
- **Prompt token blowups**
  - Mitigation: enforce PacketSizer before injection; keep soft/hard caps.
- **CT.gov/PubMed rate limits/timeouts**
  - Mitigation: centralized limiter (W1‑5) + caching + backoff + partial completion + limitations logging.
- **Serverless vs local mismatch**
  - Mitigation: FileStore is explicitly dev-only; DB store planned for production (TL‑11.2).

