# Trust Layer — Week 2 Sprint Plan (BD/licensing + scientist)

Sprint window: Week 2 (5 working days)  
Inputs:
- `TRUST_LAYER_IMPLEMENTATION_BACKLOG.md` (v0.4)
- `TRUST_LAYER_SPRINT_PLAN_WEEK1.md` (Week 1 deliverables)
- `DILIGENCE_TRUST_STACK_SCHEMAS.md` (contracts v0.1)

Objective: extend the Week 1 vertical slice into a **credible “trust loop”** by adding:

1) **Biology evidence retrieval** (scientist credibility)  
2) **Verification v0** (identifier existence + retraction safety)  
3) **Operational visibility** (source health monitoring + user warnings)

---

## Week 2 success criteria (demo-ready)

Given a query like:
- “Evaluate HER3 for breast cancer (ADC context)”
- “Tell me about pembrolizumab in melanoma”

We can:
1. Build an EvidencePacket that includes:
   - ClinicalTrials.gov + PubMed (from Week 1)
   - Biology sources (UniProt + OpenTargets + gnomAD where applicable)
2. Produce a **VerificationReport v0** that:
   - verifies existence of cited identifiers (PMID/NCT)
   - detects PubMed retractions (block + downgrade dependent claims)
   - records `verifiedAt` timestamps per evidence ref
3. Show operational status:
   - `/api/sources/health` returns Healthy/Degraded/Down per source
   - if a source is Degraded/Down, the run records it as a limitation and the UI warns the user (minimal banner is sufficient for Week 2)

---

## In scope (Week 2)

- **Biology retrieval v1**: TL‑1.4 (UniProt/OpenTargets/gnomAD)  
- **Verification v0**: TL‑3.2 (PMID/NCT existence + retraction detection)  
- **Source health monitoring v0**: TL‑10.4 (server job + API + minimal UI integration)  
- **Rate limiting extension**: TL‑1.8 (apply limiter to biology APIs too)  
- **Persistence alignment**: store verification artifacts via fileStore (TL‑11.1)

---

## Out of scope (Week 2)

- Full divergence checks (TL‑3.3) and conflict resolution (TL‑3.5)  
- HITL review UI + role enforcement (TL‑5.x)  
- DB persistence (TL‑11.2)  
- Run history search/filter (TL‑6.5)  
- Export signatures (TL‑6.4)  
- Batch processing/notifications (TL‑12)  

---

## Sprint backlog (top stories)

### Story W2‑1 — Biology retrieval connector v1 (UniProt + OpenTargets + gnomAD)
**Maps to:** TL‑1.4, TL‑1.8, TL‑1.6  
**Why now:** scientist adoption hinges on biology credibility and provenance.

**Tasks**
- Implement biology retrieval calls behind `ENABLE_RAG_RETRIEVAL`:
  - UniProt: function/summary/protein metadata
  - OpenTargets: target–disease association summaries
  - gnomAD: constraint summary where available
- Normalize into EvidencePacket:
  - evidence refs with stable IDs + retrieval logs
  - strict packet sizing (reuse PacketSizer rules)
- Apply centralized rate limiter + caching to biology calls.

**Acceptance tests**
- Query “HER3 breast cancer” produces biology evidence entries with:
  - `evidenceId`, `sourceMeta.sourceType`, `retrievalLogId`
- Re-running within TTL produces cache hits (no refetch).

---

### Story W2‑2 — Identifier verification v0 (PMID/NCT existence + verifiedAt stamping)
**Maps to:** TL‑3.2, TL‑3.4  
**Why now:** prevents fake citations and makes provenance tangible.

**Tasks**
- Implement verifier that checks:
  - PMID exists via PubMed eSummary
  - NCT exists via CT.gov v2 study endpoint
- Stamp `verifiedAt` per evidence ref and output a `VerificationReport` summary:
  - counts by pass/warn/error
  - trust level heuristic (v0)
- Persist `verification-report.json` via fileStore.

**Acceptance tests**
- If EvidencePacket includes `PMID:25891173`, verifier marks it as verified and stamps `verifiedAt`.
- If an invalid PMID is present, it becomes a verification error and is clearly reported.

---

### Story W2‑3 — Retraction detection (PubMed safety gate)
**Maps to:** TL‑3.2 (expanded)  
**Why now:** citing retracted work is an instant trust failure.

**Tasks**
- Extend PubMed verification to detect:
  - “Retracted Publication” in publication types (or equivalent indicator)
  - retraction relationships when available
- Behavior:
  - mark evidence item as CRITICAL failure
  - mark dependent claims as “blocked” / force downgrade to `[U]` unless replaced
  - add a VerificationPlan item: “replace retracted source”

**Acceptance tests**
- A known retracted PMID (test fixture) is flagged as CRITICAL and blocks dependent claims in the report.

---

### Story W2‑4 — Evidence source health monitoring v0 + status API
**Maps to:** TL‑10.4  
**Why now:** users must know when failures are source outages vs LUMINA bugs.

**Tasks**
- Create a background health checker (local dev) that runs every 5 minutes and probes:
  - CT.gov (known NCT)
  - PubMed (known query + summary)
  - One biology source (lightweight endpoint)
- Compute health states:
  - Healthy / Degraded / Down (based on success rate + latency)
- Add API endpoint:
  - `GET /api/sources/health` returns current status + last check + recent errors
- Store last 24h datapoints (Week 2: fileStore or in-memory + periodic snapshot; DB later).

**Acceptance tests**
- Health endpoint returns statuses and timestamps.
- Simulate source failure (e.g., block network in dev) → transitions to Degraded/Down with error capture.

---

### Story W2‑5 — User-facing warnings + run limitation integration
**Maps to:** TL‑10.4, TL‑1.7  
**Why now:** makes the system feel reliable and honest even when sources degrade.

**Tasks**
- When a run starts:
  - check health status for required sources
  - if Degraded/Down, add a limitation to EvidencePacket and show warning banner in UI (“Expect delays / partial results”)
- In VerificationReport:
  - tag issues that are attributable to source health (vs logic errors)

**Acceptance tests**
- With PubMed Degraded, user sees warning and EvidencePacket includes limitation text.

---

### Story W2‑6 (Stretch) — Progressive verification plumbing (events only)
**Maps to:** TL‑4.4 (future UI), TL‑3.4  
**Why:** sets up background verification UX later without committing UI work now.

**Tasks**
- Add a separate event stream or SSE event type for:
  - “verification started”
  - “verification complete”
  - summary counts

**Acceptance tests**
- During a run, UI can show “Verifying…” then “Verified” without blocking the entire response pipeline (even if UI is minimal).

---

## Daily plan (recommended sequencing)

- **Day 1:** W2‑1 (biology retrieval connector skeleton + packet integration)
- **Day 2:** W2‑2 (identifier verification v0 + persisted report)
- **Day 3:** W2‑3 (retraction detection) + fixtures
- **Day 4:** W2‑4 (health monitor + API) + basic storage
- **Day 5:** W2‑5 (warnings + limitations integration) + W2‑6 stretch

---

## Demo script (end of Week 2)

1. Open source status page (or call `/api/sources/health`) to show current source health.
2. Run “HER3 breast cancer ADC”:
   - show biology evidence entries (UniProt/OpenTargets/gnomAD)
   - show CT.gov + PubMed entries
3. Show `verification-report.json` with:
   - verified PMIDs/NCTs
   - `verifiedAt` timestamps
4. Simulate degraded PubMed (or force timeout):
   - show warning banner + limitation added to packet
   - verification report indicates source health impact

---

## Key risks (Week 2) and mitigations

- **Biology APIs vary in availability/rate limits**
  - Mitigation: strict limiter, caching, and “partial evidence” behavior (record limitations).
- **Retraction detection fields may be inconsistent across PubMed endpoints**
  - Mitigation: implement conservative detection; if unknown, mark “needs manual check” rather than claiming safe.
- **Health monitoring in serverless**
  - Mitigation: Week 2 targets local dev + architecture; production scheduling can be via cron/queue later.

