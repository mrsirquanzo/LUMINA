# Trust Layer Implementation Backlog (BD/licensing + scientist) — v0.4

Purpose: Convert LUMINA from “prompting + hope” into **grounded, auditable, court‑ready** diligence outputs by enforcing:
- **Just‑in‑time RAG** (authoritative retrieval → structured packet)
- **Contracts‑first generation** (Claim Ledger + Retrieval Log + Verification Plan)
- **Verification** (existence + divergence checks)
- **Trust UI** (tier badges + evidence drawers)
- **Human‑in‑the‑loop** (approve/annotate/lock)

Canonical data contracts: `DILIGENCE_TRUST_STACK_SCHEMAS.md`

Updates in v0.4 (production readiness gap-fill):
- Expand entity extraction to include **drug/condition/company** + disambiguation/linking.
- Add **trial results retrieval** strategy + explicit efficacy validation protocol.
- Add **caching/dedup**, **error recovery**, **conflict resolution**, **retraction detection**.
- Add epics for **cost management** and **rollout/feature flags/monitoring**.
- Add **narrative generation** (ledger → stakeholder memo) as a first-class deliverable.
- Add **data persistence architecture** (file-based dev → DB production) for auditability + multi-user.
- Specify **EvidencePacket size controls** (limits, prioritization, truncation, overflow behavior).
- Add **HITL permissions model** (roles + locking authority + audit log).
- Add **export integrity/signatures** (tamper-evident exports + verification utility).
- Add **batch processing/job queue** (optional for v1; critical for team-scale adoption).
- Added a concrete Week 1 execution plan:
  - `TRUST_LAYER_SPRINT_PLAN_WEEK1.md`
- Add operational scalability:
  - centralized **rate limiting coordination** (shared quotas + priority scheduling)
  - **run history search/filter** (findability at scale)
  - **evidence source health monitoring** (status page + operator alerts)
- Add v1.1+ roadmap items:
  - backups/DR, progressive verification UX, template variables, claim comment threads, compliance extensions.

---

## Current state (relevant to this backlog)

- MCP servers exist and already implement real retrieval for clinical:
  - `src/lib/mcp/clinicalServer.ts` includes ClinicalTrials.gov API v2 + PubMed E‑utilities.
- Orchestration currently injects MCP **capabilities description** only:
  - `src/lib/mcp/mcpClient.ts#getContextForAgent()` returns “available tools/resources”, not retrieved data.
- **Gap:** agents are not grounded on retrieved evidence packets; there is no post‑generation verification layer.

---

## Phases (timeline view)

This backlog is organized as epics that map cleanly to phases:

- **Phase 0 (Week 0): Contracts + schema/versioning + rollout switches + permission model (+ ops visibility plan)**
- **Phase 1 (Weeks 1–3): Activate just‑in‑time RAG + evidence packets (size controls) + caching/dedup + error recovery + rate limiting coordination + persistence v1 (dev)**
- **Phase 2 (Weeks 4–5): Verification v1 (existence + mapping + basic divergence + retractions) + persistence v2 (DB)**
- **Phase 3 (Weeks 6–7): Human‑in‑the‑loop (HITL) review + approvals (with role enforcement)**
- **Phase 4 (Weeks 8–9): Trust UI primitives across tiles/side panel/exports**
- **Phase 5 (Weeks 10–14): Audit trail + run versioning + run history search/filter + BD workflows + cost management + export integrity + (optional) batch jobs**

---

## Epic TL‑0 — Contract alignment + “north star” definition (Week 0 / setup)

### TL‑0.1 — Finalize canonical artifacts for every run
**User story:** As a BD lead/scientist, I want every analysis run to output the same core artifacts so I can review and share results confidently.

**Acceptance criteria:**
- Every run produces (even if partially populated):
  - `ClaimLedger` (schemaVersion 0.1)
  - `RetrievalQuery[]` logs for any `[R]`
  - `VerificationPlan` (schemaVersion 0.1)
  - `VerificationReport` (new) summarizing checks + flagged issues
- Exports and UI can render from these artifacts (narrative is derived, not canonical).

**Likely touch points (later epics):**
- `src/lib/orchestrationEngine.ts` (run lifecycle)
- New: `src/lib/trust/*` (artifacts + validators)

### TL‑0.2 — Schema evolution + migrations (versioning strategy)
**User story:** As an operator, I want schema changes to be forward-compatible so the product can evolve without breaking old runs or exports.

**Acceptance criteria:**
- Every artifact embeds `schemaVersion` (already in v0.1 contracts).
- Runtime validators reject unknown schema versions with a clear error.
- Provide forward-only migration utilities (e.g., `v0_1 → v0_2`) for:
  - `ClaimLedger`
  - `VerificationPlan`
  - `SonnySynthesis` (derived view)
- Legacy artifacts can be marked “Legacy (pre-verification)” and re-run to upgrade.

### TL‑0.3 — Performance & reliability targets (SLA definitions)
**User story:** As a user, I want predictable latency and graceful degradation so the system is usable in real diligence workflows.

**Acceptance criteria:**
- Define baseline targets:
  - Fast mode: P95 < 60s (Phase 1), < 30s (Phase 4)
  - Thorough mode: P95 < 5 min (Phase 1), < 3 min (Phase 4)
- Define reliability targets:
  - Retrieval error rate < 5% per source (rolling window)
  - Orchestration completion rate > 98%
- Track these metrics (see TL‑10 monitoring).

---

## Epic TL‑1 — Evidence packet builder (Activate RAG) (Weeks 1–3)

**Goal:** Retrieve authoritative data **server-side** and inject it into agent calls as a structured packet.

### TL‑1.1 — Entity extraction (deterministic first)
**User story:** As the system, I can extract high-signal identifiers from the query/documents to drive targeted retrieval (not broad search).

**Acceptance criteria:**
- Extract with deterministic patterns:
  - NCT IDs (`NCT\\d{8}`)
  - PMIDs (`PMID:?\\s*\\d{7,8}`)
  - DOI (basic regex)
  - Patent identifiers (basic patterns; phase in later)
- Extract high-value domain entities (bounded + with confidence):
  - Drug names (normalized):
    - dictionary/lookup-first: ChEMBL (preferred, free) and/or internal curated list
    - morphology heuristics (e.g., `-mab`, `-nib`, `-zumab`, `-tinib`) as *candidates*, then confirm by lookup
    - **Note:** DrugBank is not assumed due to licensing; can be added if licensed.
  - Indications/conditions:
    - MeSH term lookup where feasible
    - allow explicit user-provided indication field to override extraction
  - Company/sponsor names:
    - extract from provided documents + known sponsor fields returned by CT.gov results
    - lightweight NER (or LLM-assisted extraction) allowed, but must emit confidence + be treated as “candidate” until retrieval confirms
- Guardrails:
  - Disallow brittle gene symbol heuristics from becoming “facts”; store as candidates with low confidence unless validated (reduces FAST/word collisions).
- Output is bounded (caps per entity type).
- Includes an `extractionLog` describing what matched and what was ignored.

**Planned files:**
- New: `src/lib/trust/entityExtraction.ts`

### TL‑1.1b — Entity disambiguation + linking
**User story:** As the system, I can link extracted entities (drug ↔ target ↔ trials ↔ publications) to improve retrieval precision and reduce ambiguity.

**Acceptance criteria:**
- Disambiguate ambiguous tokens (examples):
  - gene vs word collisions (FAST, MET, KIT)
  - drug brand vs generic
  - company vs study acronym
- Create linked identifiers:
  - drug → normalized ID (e.g., ChEMBL ID) where possible
  - drug + indication → candidate NCT IDs
  - NCT → candidate PubMed IDs via PubMed search for the NCT string
- Store linking confidence and rationale in `extractionLog`.

### TL‑1.2 — EvidencePacket schema + builder
**User story:** As the system, I can assemble retrieved evidence into a single JSON packet with stable IDs, logs, and provenance timestamps.

**Acceptance criteria:**
- EvidencePacket contains:
  - `retrievalLogs: RetrievalQuery[]`
  - `evidence: EvidenceRef[]` (stable `evidenceId`)
  - `sources: { clinicalTrials?: ..., pubmed?: ..., fda?: ... }` (structured subsets)
  - `asOf: ISO timestamp` + cache TTL metadata
- Size controls (hard limits; enforce before prompt injection):
  - Max evidence refs per source type (defaults, configurable):
    - Clinical trials: 20 (prioritize by relevance/recency; always include explicit NCT matches)
    - PubMed: 30 (always include explicit PMID matches)
    - Biology DB entries: 10
    - FDA/labels: 10
  - Max excerpt lengths (defaults, configurable):
    - Trial summary: ≤ 500 words
    - Abstract excerpt: ≤ 300 words
    - Structured JSON blocks: prefer “selected fields” and cap per-item payload to ~5KB
  - Total packet size:
    - Target: < ~50K tokens injected to the model (soft cap)
    - Hard cap: < ~100K tokens (abort injection if exceeded; require narrowing)
    - Always store full raw retrieval in cache; only truncate for packet injection.
  - Prioritization order when over limit:
    1. Exact ID matches (NCT/PMID/DOI from query/docs) → always include
    2. Direct lookup results > search results
    3. Reliability tier: Tier 1 > Tier 2 > Tier 3
    4. Recency (newer cut / later date preferred when comparable)
    5. Relevance score (if available)
  - Truncation rules:
    - Truncate at sentence boundaries (no mid-sentence cuts)
    - Add markers: `[truncated from {original_words} words]`
    - Preserve locators (page/section/figure/table) even when excerpt is truncated
  - Overflow handling:
    - If retrieved > included: log `limitations` explaining trimming (e.g., “Retrieved 45 trials, included top 20”)
    - Provide a “narrow scope” suggestion list (e.g., “add NCT IDs / specify indication / sponsor”)

**Planned files:**
- New: `src/lib/trust/evidencePacket.ts`
- New: `src/lib/trust/evidenceId.ts` (stable ID helper, e.g., hash)
- New: `src/lib/trust/packetSizer.ts` (prioritization + truncation + overflow logging)

### TL‑1.3 — Clinical retrieval connector (CT.gov + PubMed) via MCP execution
**User story:** As a clinical/strategy user, when I mention a trial or topic, the system retrieves verified CT.gov/PubMed records and includes them in the packet.

**Acceptance criteria:**
- If query contains NCT IDs:
  - call MCP tool `get_trial_details` per ID
- Else:
  - call `search_clinical_trials` with condition/intervention derived from entity extraction
- For PubMed:
  - if PMIDs present, fetch summaries (add MCP tool if needed or use existing client)
  - else run `search_pubmed` with query terms
- Capture “results availability” signals:
  - mark whether CT.gov has posted results for each NCT (where detectable)
- Every retrieval produces a `RetrievalQuery` log entry with limitations.

**Planned files:**
- New: `src/lib/trust/retrieval/clinical.ts`
- Uses: `src/lib/mcp/mcpClient.ts` + `src/lib/mcp/clinicalServer.ts`

### TL‑1.3b — Trial results retrieval (hybrid strategy)
**User story:** As a BD/scientist user, I want the system to retrieve *actual trial results* where available (and clearly label when they are not), since most diligence questions center on efficacy/safety outcomes.

**Acceptance criteria:**
- Phase 1 (MVP):
  - Retrieve CT.gov `resultsSection` (or equivalent) when present and include it in the EvidencePacket as structured data + evidence refs.
  - For trials without CT.gov posted results:
    - search PubMed for the NCT ID string and include candidate publications (with metadata + confidence notes).
  - Explicitly mark each trial as:
    - `hasStructuredResults: true|false|unknown`
    - `resultsSources: ['ctgov' | 'pubmed' | 'gosset' | 'other']`
- Phase 2 (optional, gated):
  - If a structured outcome table/excerpt is retrieved, allow extraction of outcome values into a structured format with **manual-review-by-default**.
- Phase 3 (optional):
  - If Gosset.ai is enabled and returns outcomes, treat as Tiered evidence with full retrieval log.


### TL‑1.4 — Biology retrieval connector (scientist trust ROI) (hybrid: MCP + existing clients)
**User story:** As a scientist, I want biology claims grounded to authoritative databases (UniProt/OpenTargets/gnomAD) rather than model memory.

**Acceptance criteria:**
- For a gene/target symbol, retrieve:
  - UniProt summary + function
  - OpenTargets association summaries
  - gnomAD constraint summaries (where available)
- All retrieved items are logged and included as evidence refs.

**Planned files:**
- New: `src/lib/trust/retrieval/biology.ts`
- Uses existing clients:
  - `src/lib/clients/biology/*`

### TL‑1.5 — Orchestration integration: inject EvidencePacket into each agent call
**User story:** As the system, every agent run receives a tailored evidence packet and is instructed to cite only from it.

**Acceptance criteria:**
- `src/lib/orchestrationEngine.ts` builds an evidence packet per agent step (or shared packet cached per run).
- EvidencePacket is provided to the model as a bounded JSON block (or summarized + IDs).
- Prompt wrapper adds a hard constraint:
  - “Only cite evidence IDs present in the packet; otherwise mark [U] + add to Verification Plan.”

**Planned files:**
- Update: `src/lib/orchestrationEngine.ts`
- New: `src/lib/trust/promptInjection.ts`

### TL‑1.6 — Evidence caching + deduplication (within-run and cross-run)
**User story:** As a user, I want the system to reuse recently retrieved evidence so repeated analyses are fast, cheaper, and less rate-limit prone.

**Acceptance criteria:**
- Cache evidence refs by stable key (e.g., `NCT` + source + version hash) and store:
  - `verifiedAt`, `asOf`, and TTL metadata
- Default TTLs (configurable):
  - ClinicalTrials.gov: 24h
  - PubMed metadata: 7 days
  - Biology DBs: 30 days
  - FDA labels/indications: 7 days (or shorter in fast-moving contexts)
- Dedup strategy:
  - Shared cache across agents in the same run (do not fetch NCT 5 times)
  - Persistent cache across runs with eviction policy (LRU / size cap)
- User controls:
  - “Force refresh” for a run
  - auto-refresh when stale beyond TTL
  - expiry warnings:
    - when cached evidence is >80% of TTL, surface “evidence aging” warning and allow targeted refresh per evidence ref (without re-running everything)

**Planned files:**
- New: `src/lib/trust/evidenceCache.ts`
- Reuse/extend: `src/lib/utils/biology/cache.ts`

### TL‑1.7 — Retrieval error handling + recovery (graceful degradation)
**User story:** As a user, I want partial evidence when some sources fail (with clear warnings), rather than the entire analysis failing.

**Acceptance criteria:**
- Per retrieval call:
  - timeout (default 10s, configurable)
  - retries: up to 3 with exponential backoff for transient errors
- Error classification:
  - TRANSIENT (timeouts, 429s) → retry
  - PERMANENT (404, invalid ID) → skip + log
  - CRITICAL (auth/config failure) → abort run with actionable message
- Output behavior:
  - evidence packet includes failure records in `retrievalLogs` with `limitations` / error fields
  - VerificationPlan automatically includes items for missing evidence (“must-resolve” if claim-critical)
- UX behavior:
  - UI can show “3/5 sources retrieved; 2 failed” and offer “retry failed sources”

**Planned files:**
- New: `src/lib/trust/retrieval/errorHandler.ts`
- Update: `src/lib/trust/retrieval/*.ts` to use the handler

### TL‑1.8 — Rate limiting coordination (shared quota management)
**User story:** As the system, I can coordinate API rate limits across all users and job types so no single user exhausts shared quotas or triggers bans/runaway costs.

**Acceptance criteria:**
- Centralized rate limiter (shared state):
  - Token bucket (or leaky bucket) per provider/source
  - Configurable defaults per provider (tunable per deployment):
    - PubMed: 10 req/sec with key, 3 req/sec without
    - ClinicalTrials.gov: 5 req/sec (conservative)
    - Perplexity: enforce per-account tier limits (paid)
    - Biology APIs: enforce documented limits (or conservative defaults)
  - Priority-aware scheduling:
    - urgent/interactive > batch > background
    - fair queuing within same priority (prevent starvation)
- Quota tracking + backpressure:
  - per-provider metrics (req/sec, req/day, recent 429s)
  - throttle when at capacity:
    - return 429 + `Retry-After` for internal callers
    - degrade gracefully for user-facing flows (warn + partial evidence)
- Error handling integration:
  - detect upstream 429s and feed into adaptive backoff
  - alert ops/admin when sustained rate limiting is detected (ties to TL‑10 monitoring)
- Multi-instance coordination (production):
  - shared backend state (Redis preferred)
  - distributed limiter semantics across instances

**Planned files:**
- New: `src/lib/trust/retrieval/rateLimiter.ts`
- Update: all retrieval connectors to use the centralized limiter (replacing scattered per-client logic)

---

## Epic TL‑2 — Contracts-first agent outputs (Weeks 1–3, overlaps with TL‑1)

**Goal:** Make agent responses parseable into the canonical artifacts.

### TL‑2.1 — “Ledgerizer” pass (incremental migration)
**User story:** As the system, I can transform an agent’s narrative into a Claim Ledger + Verification Plan that references only packet evidence IDs.

**Acceptance criteria:**
- Input: agent narrative + EvidencePacket
- Output: `ClaimLedger` + `VerificationPlan` (schemaVersion 0.1)
- Every claim:
  - atomic (no bundling)
  - has `tag` and `evidence[]` (or `[U]`)
- If the model fails schema validation, system retries once with a stricter formatter prompt.

**Planned files:**
- New: `src/lib/trust/ledgerizer.ts`
- New: `src/lib/trust/schemaValidation.ts` (runtime validation; consider Zod in implementation)

### TL‑2.2 — Direct JSON mode (target state)
**User story:** As a system operator, I can configure agents to emit ClaimLedger directly to reduce extra passes and drift.

**Acceptance criteria:**
- Per agent, toggle “direct JSON output” via config.
- When enabled, agent returns ClaimLedger/VerificationPlan without narrative-first formatting.

**Planned files:**
- New: `src/lib/trust/config.ts`
- Update (later): `src/lib/agentPrompts.ts` to include JSON output requirements in a controlled way

### TL‑2.3 — Narrative generator (ledger → stakeholder memo)
**User story:** As a BD lead/scientist, I want a polished, readable memo generated from the verified ledger so I can share with stakeholders (executives/legal/scientists) without exposing raw JSON.

**Acceptance criteria:**
- Generate a structured narrative from:
  - `ClaimLedger`
  - `VerificationReport`
  - `VerificationPlan`
- Narrative rules:
  - Default to include only verified or approved claims (configurable).
  - Include uncertainties and verification items as callout boxes (no burying).
  - Inline citations reference evidence IDs and include tier + “last verified”.
- Export formats:
  - PDF (print-styled HTML)
  - DOCX (HTML for editing)
  - JSON (canonical, already)
  - Optional: Markdown (for internal dev readability, not primary)

**Planned files:**
- New: `src/lib/trust/narrativeGenerator.ts`
- Reuse: `src/lib/professionalExport.ts`

---

## Epic TL‑3 — Verification v1 (Weeks 4–5)

**Goal:** Enforce provenance and catch hallucinations automatically.

### TL‑3.1 — Evidence mapping verification (packet ↔ ledger)
**User story:** As a diligence user, I want the system to guarantee that any `[R]` claim maps to retrieved evidence, not invented references.

**Acceptance criteria:**
- For each claim:
  - all evidence IDs exist in the EvidencePacket
  - `[R]` claims link to a retrieval log entry (`retrievalLogId`)
  - missing mappings become flagged issues + downgrade to `[U]` (or block export until reviewed)

**Planned files:**
- New: `src/lib/trust/verification/evidenceMappingVerifier.ts`

### TL‑3.2 — Identifier existence verification (PMID/NCT/URLs)
**User story:** As a diligence user, I want the system to confirm that referenced PMIDs/NCT IDs exist and are current.

**Acceptance criteria:**
- For any evidence ref containing:
  - PMID → validate via PubMed eSummary
  - NCT → validate via CT.gov v2 endpoint
  - URL → validate reachability (graded; handle blocked HEAD)
- PubMed safety checks (credibility-critical):
  - detect retractions:
    - PublicationType includes “Retracted Publication” OR
    - presence of “Retraction in” / “Retraction of” relationships
  - If retracted:
    - mark as **CRITICAL** verification failure
    - block the evidence ref from “verified” status
    - force any dependent claims to downgrade to `[U]` unless replaced
    - add VerificationPlan item to find replacement sources
- Store `verifiedAt` timestamp per evidence item.

**Planned files:**
- New: `src/lib/trust/verification/identifierVerifier.ts`

### TL‑3.3 — Basic divergence checks (structured fields only)
**User story:** As a diligence user, I want the system to flag when the agent’s stated phase/status/enrollment conflicts with retrieved records.

**Acceptance criteria:**
- Auto-check claims about:
  - phase, status, enrollment count/type, sponsor, key dates
- If mismatch:
  - flag as 🔴 “data mismatch”
  - add Verification Plan item (or require human review)

**Planned files:**
- New: `src/lib/trust/verification/divergenceVerifier.ts`

### TL‑3.3b — Efficacy claims validation protocol (explicit constraints)
**User story:** As a diligence user, I want efficacy claims (ORR/PFS/OS/p-values) to be handled safely: verified when possible, otherwise clearly flagged as unverified and escalated.

**Acceptance criteria:**
- Efficacy claims are never treated as “auto-verified” unless:
  - a structured result is present in the EvidencePacket (e.g., CT.gov resultsSection), OR
  - a retrieved excerpt/table is included with a locator and provenance
- Tagging policy:
  - `[R]` only if retrieved and mapped to packet evidence
  - `[U]` with HIGH priority verification item if not retrievable
  - `[H]` only for explicitly labeled calculations/assumptions (rare)
- VerificationReport categorizes efficacy claims as:
  - verified / unverified (manual review required) / blocked (retracted source)

### TL‑3.4 — Verification report + trust score
**User story:** As a BD lead, I want a single trust summary showing verified vs unverified claims and the risk profile.

**Acceptance criteria:**
- Produce `VerificationReport` including:
  - counts by severity (pass/warn/error)
  - trust score and trust level heuristic
  - list of flagged claims with reasons
- Attach to SSE events and persist in run artifacts.

**Planned files:**
- New: `src/lib/trust/verification/report.ts`
- Update: `src/lib/multiAgentTypes.ts` (types for SSE + message attachments)

### TL‑3.5 — Conflicting evidence detection + resolution (source divergence)
**User story:** As a reviewer, when retrieved sources conflict, I want the system to flag the conflict and suggest the most authoritative resolution — without hiding the disagreement.

**Acceptance criteria:**
- Detect conflicts when:
  - same attribute (e.g., ORR) appears from multiple sources for the same entity (trial/drug/indication), AND
  - values differ beyond a threshold (configurable; e.g., >5% relative difference)
- Resolution suggestion hierarchy (default):
  1. Peer-reviewed publication > conference abstract
  2. Later date cut > earlier (if same endpoint)
  3. Primary endpoint > exploratory
  4. FDA label/review > company press release
- Output:
  - conflicts become MEDIUM severity review items (unless safety-critical)
  - allow “both valid” with context (different cutoffs/cohorts/analysis set)
- Store conflicts in the ClaimLedger:
  - as `claim.conflicts[]` linking claimIds + notes

**Planned files:**
- New: `src/lib/trust/verification/conflictResolver.ts`

---

## Epic TL‑4 — Trust UI primitives (Weeks 8–9)

**Goal:** Make provenance visible instantly across side panel and tiles.

### TL‑4.1 — Claim chips + tier badges
**User story:** As a user, I can see at a glance whether each claim is `[P]/[R]/[U]/[H]` and what tier the source is.

**Acceptance criteria:**
- Claims render with:
  - evidence tag chip
  - tier badge (Tier 1/2/3 derived from `EvidenceRef.sourceMeta.reliabilityTier`)
  - verification state (verified / mismatch / unverified)

**Planned files:**
- New UI components: `src/components/shared/*` (TBD)
- Integrate into tiles + side panel outputs.

### TL‑4.2 — Evidence drawer (excerpt + locator + “view source”)
**User story:** As a diligence user, I can click a claim and see the exact excerpt and source metadata used.

**Acceptance criteria:**
- Drawer shows:
  - excerpt + locator fields
  - retrieved-at timestamp
  - link to source (where applicable)
  - retrieval log entry (query + limitations)

### TL‑4.3 — “Flagged issues” triage panel (read-only v1)
**User story:** As a user, I can quickly find which claims need review and why.

**Acceptance criteria:**
- Panel lists flagged issues grouped by severity and agent.
- Clicking issue navigates to claim + evidence.

### TL‑4.4 — Progressive verification UI (background verification) (v1.1)
**User story:** As a user, I want to start reviewing agent responses while verification runs in the background, rather than waiting for full completion.

**Acceptance criteria:**
- Render agent response immediately with “⏳ Verifying…” indicators.
- Update claim/citation badges in real-time as verification completes (SSE/stream updates).
- Allow evidence drawer access before verification finishes (clearly labeled “unverified / in progress”).

---

## Epic TL‑5 — Human-in-the-loop (HITL) review + approvals (Weeks 6–7)

**Goal:** Make outputs safe for sharing and stakeholder workflows.

### TL‑5.0 — Permission model + roles (Phase 0 prerequisite; enforcement in TL‑5.1–TL‑5.3)
**User story:** As a BD director/scientist lead, I want to control who can approve claims and lock outputs so only qualified reviewers make binding decisions.

**Acceptance criteria:**
- Define roles (org-level or per-analysis):
  - **Viewer:** read-only access to runs, evidence, and flags
  - **Contributor:** can comment on flags and suggest edits (non-binding)
  - **Reviewer:** can approve/reject/edit flags for assigned domains
  - **Approver:** can lock sections for export (BD director / scientist lead)
  - **Admin:** full access; can reassign ownership and override decisions
- Per-flag permissions:
  - flag creator can edit/delete their own flag before review begins
  - assigned reviewers can approve/reject/edit within scope
  - approvers can override (with mandatory rationale)
- Section locking:
  - only Approver+ can lock
  - locked sections cannot be edited without explicit unlock + re-approval
- Audit log:
  - every approve/reject/edit/lock/unlock action captured with who/when/what/why

**Planned files:**
- New: `src/lib/trust/permissions.ts`
- Update: HITL flag store + APIs to enforce permission checks

### TL‑5.1 — Flag generation + persistence model
**User story:** As the system, I automatically create review flags for unverifiable or mismatched claims.

**Acceptance criteria:**
- Flags created for:
  - missing evidence mapping
  - identifier not found
  - divergence mismatch
- Flags are persisted per run via the persistence layer (TL‑11) with multi-user-safe updates.

### TL‑5.2 — Review actions: accept / edit / reject
**User story:** As a reviewer, I can resolve flagged claims and record rationale.

**Acceptance criteria:**
- Each flag supports:
  - accept (mark as approved)
  - edit (replace claim text; attach evidence)
  - reject (remove claim; add note)
- Store reviewer, timestamp, and notes.

### TL‑5.3 — Locking + export governance
**User story:** As a BD lead, I can export an “approved” memo that won’t drift unless I unlock it.

**Acceptance criteria:**
- Approved sections/claims can be locked.
- Exports include an approvals/change-log appendix.

### TL‑5.4 — Undo/rollback for review actions (v1.1)
**User story:** As a reviewer, I can undo recent review actions to correct mistakes without corrupting the audit trail.

**Acceptance criteria:**
- Maintain an undo stack per run (default last 10 actions; configurable).
- Undo is limited to the actor’s own actions (unless Admin).
- Undo is itself an auditable event (no silent deletes).

### TL‑5.5 — Comment threads on claims (collaboration) (v1.2)
**User story:** As a BD/scientist team, I can discuss specific claims in-context so review decisions are documented and discoverable.

**Acceptance criteria:**
- Threaded comments attach to `claimId` (and optionally `evidenceId`).
- Support @mentions (future) and resolve/unresolve discussion status.
- Comments are included in audit trail (who/when) and optionally in export appendices (configurable).

---

## Epic TL‑6 — Audit trail + run versioning (Weeks 10–14)

**Goal:** Reproducibility: “as of” sources, model/prompt versions, and diffs.

### TL‑6.1 — Run artifacts store
**User story:** As a user, I can return to a past run and see exactly what sources were used and when.

**Acceptance criteria:**
- Store per run:
  - runId, timestamps
  - EvidencePacket (or hash + cached snapshot)
  - ClaimLedger + VerificationPlan + VerificationReport
  - model/provider versions, prompt version identifiers
- Storage uses the persistence layer (TL‑11):
  - completed runs are immutable (append-only audit events)
  - partial/running state is safely updatable without corruption

### TL‑6.2 — Run diff view
**User story:** As a BD lead, I can compare two runs and see what claims changed and why.

**Acceptance criteria:**
- Diff shows:
  - added/removed/modified claims
  - changes in verification state
  - changes in retrieved sources (as-of timestamps)

### TL‑6.3 — Legacy analysis handling (“pre-verification” runs)
**User story:** As a user, I want older analyses created before the trust layer to remain accessible, clearly labeled, and upgradeable.

**Acceptance criteria:**
- Legacy runs are labeled:
  - “Legacy (pre-verification)” with visible disclaimer on exports
- Users can “Upgrade to verified”:
  - re-run analysis with current trust layer enabled
  - preserve link between legacy run and upgraded run
- No breaking changes to existing stored analysis history:
  - old runs remain renderable even if verification artifacts are missing

### TL‑6.4 — Export integrity + cryptographic signatures (court-ready provenance)
**User story:** As a BD lead, I want exported memos to be tamper-evident so I can prove authenticity to legal/counterparties and detect post-export modification.

**Acceptance criteria:**
- Every export includes a metadata appendix with:
  - export timestamp (ISO 8601)
  - runId + artifact schema versions
  - hash (SHA-256) of:
    - EvidencePacket JSON (or stable canonical hash if packet is stored separately)
    - ClaimLedger JSON
    - VerificationReport JSON
    - VerificationPlan JSON
  - generator metadata:
    - userId (or actor id)
    - system version/build id
    - model/provider versions (where available)
- Optional cryptographic signature (configurable):
  - HMAC-SHA256 over the concatenated hashes + metadata fields
  - secret key stored securely (env var / secrets manager)
  - signature embedded in:
    - PDF footer + metadata page
    - DOCX properties + metadata section
    - JSON top-level `integrity` field
- Verification utility:
  - CLI/script to verify an export:
    - recompute hashes
    - validate signature (if enabled)
    - confirm no drift vs stored run artifacts

**Planned files:**
- New: `src/lib/trust/exportIntegrity.ts`
- New: `scripts/verify-export.ts`

### TL‑6.5 — Run history search & filter (findability at scale)
**User story:** As a BD analyst, I can quickly find past analyses by drug/target/company/query so I don’t duplicate work or lose institutional memory.

**Acceptance criteria:**
- Search interface (API + UI):
  - full-text search on query text
  - filters:
    - date range (`created_at`)
    - mode (fast/thorough)
    - status (running/completed/failed)
    - trust level (high/medium/low/unverified)
    - user/analyst (multi-user)
    - cost range (if cost tracking enabled)
  - sort:
    - date (default newest)
    - trust score
    - cost
- Search performance targets:
  - < 500ms for 1000+ runs (P95) with pagination (50/page)
  - DB indices on common filters (when using TL‑11.2)
- Saved searches (v1.1):
  - users can save frequent filter combinations (e.g., “All melanoma analyses by Sarah in Q4”)
- Export search results:
  - CSV summary table: `run_id, query, date, trust_score, cost, status`

**Planned files:**
- New API: `GET /api/runs/search?q=...&trust_level=...`
- New UI: `src/components/RunHistory/SearchPanel.tsx`
- DB index (illustrative): `CREATE INDEX idx_runs_search ON analysis_runs(user_id, created_at DESC);`

---

## Epic TL‑7 — BD workflow templates (Weeks 10–14)

**Goal:** Convert analysis into actionable BD artifacts.

### TL‑7.1 — Data room request pack (from VerificationPlan)
**User story:** As a BD user, I can export a structured data room request list mapped to uncertainties and decision triggers.

**Acceptance criteria:**
- Export groups requests by domain (clinical, IP, regulatory, CMC, etc.).
- Each request includes “why critical” + “what it unlocks” + acceptance criteria.

### TL‑7.2 — Diligence checklist + owner assignment (optional)
**User story:** As a BD lead, I can assign verification items to owners with due dates.

**Acceptance criteria:**
- Verification items support owner + due date + status.

### TL‑7.3 — Query template library (common DD patterns) (v1.1)
**User story:** As a new BD/scientist user, I want pre-built query templates for standard diligence workflows so I don’t have to learn “promptcraft” to get consistent outputs.

**Acceptance criteria:**
- Provide templates for common patterns:
  - Target validation: “Evaluate {gene} for {indication}”
  - Competitor scan: “Analyze {company} pipeline in {area}”
  - Trial benchmarking: “Compare {NCT_ID} to standard of care”
  - IP landscape: “Assess patent/FTO for {drug/target}”
- Each template includes:
  - recommended mode (fast vs thorough)
  - expected artifact outputs
  - expected cost range (uses TL‑9 tracking)

### TL‑7.3b — Template variable substitution + parameterization (v1.1)
**User story:** As a user, I want templates with variables (e.g., `{{gene}}`, `{{indication}}`) so I can run standardized diligence workflows without editing free text.

**Acceptance criteria:**
- Templates define variables with types and validation:
  - `gene`: must be a valid symbol (basic validation + allow override)
  - `indication`: free text + optional ontology mapping later
  - `company`: free text + optional normalization later
- UI provides a simple form for variables and previews the final query.
- Validation runs before submission; errors are actionable.

---

## Epic TL‑8 — Testing + evaluation harness (continuous)

### TL‑8.1 — Unit tests for extraction + verifiers
**Acceptance criteria:**
- Tests cover:
  - NCT/PMID extraction
  - evidence mapping verifier
  - identifier verifier (mocked)
  - divergence checks (mocked structured data)

### TL‑8.2 — Integration tests (orchestrator)
**Acceptance criteria:**
- End-to-end test that:
  - builds EvidencePacket
  - runs one agent
  - produces ClaimLedger + VerificationReport

### TL‑8.3 — Golden test cases (hallucination regression)
**Acceptance criteria:**
- Maintain a small suite of known prompts where:
  - unsupported claims must become `[U]`
  - citations must map to packet evidence IDs

---

## Epic TL‑9 — Cost tracking + budget controls (Weeks 10–14; build incrementally)

**Goal:** Prevent “surprise bills” and enable predictable usage across different customer profiles.

### TL‑9.1 — Per-run cost tracking (estimate + actual)
**User story:** As a user, I want to see estimated and actual costs per run so I can manage budget and choose fast vs thorough modes appropriately.

**Acceptance criteria:**
- Track costs by:
  - LLM provider (Anthropic / Google / Perplexity) via token usage
  - Retrieval calls (counts, and optional $ estimates where applicable)
  - Verification passes (counts + token usage)
- Surface:
  - pre-run estimate (based on mode + expected retrieval breadth)
  - real-time running estimate
  - post-run breakdown by agent and by layer (retrieval vs generation vs verification)

### TL‑9.2 — Cost optimization strategies
**Acceptance criteria:**
- Batch where possible (e.g., PubMed can fetch multiple PMIDs in one request).
- Reuse evidence cache aggressively (TL‑1.6).
- Offer “economy mode”:
  - smaller top‑K retrieval
  - existence verification only (no divergence checks)
  - lower-token narrative generation

---

## Epic TL‑10 — Rollout strategy + feature flags + monitoring (cross-cutting)

**Goal:** Ship trust infrastructure safely without breaking existing demo flows or current users.

### TL‑10.1 — Feature flags (progressive rollout)
**User story:** As an operator, I can enable trust features gradually and roll back quickly if something spikes error rates or cost.

**Acceptance criteria:**
- Implement feature flags (env/config) for:
  - `ENABLE_RAG_RETRIEVAL`
  - `ENABLE_VERIFICATION`
  - `ENABLE_DIVERGENCE_CHECKS`
  - `ENABLE_HITL`
  - `ENABLE_COST_TRACKING`
  - `ENABLE_PERSISTENCE_FILE` (dev/local)
  - `ENABLE_PERSISTENCE_DB` (production)
  - `ENABLE_EXPORT_SIGNATURES`
  - `ENABLE_BATCH_PROCESSING` (optional)
- Rollout plan:
  - internal ON first
  - beta opt-in
  - default ON once stable

### TL‑10.2 — Monitoring + alerting (latency, errors, cost)
**User story:** As an operator, I can detect regressions early and quantify whether the trust layer is improving reliability.

**Acceptance criteria:**
- Track:
  - latency (P50/P95/P99) per phase (retrieval/generation/verification)
  - error rate by source/provider
  - completion rate
  - cost per run (avg + P95)
- Alerts (thresholds configurable):
  - error rate > 5%
  - P95 latency > 2x baseline
  - cost spike > 50% vs baseline

### TL‑10.3 — Demo mode compatibility (simulated trust artifacts)
**User story:** As a demo user, I want instant playback scenarios that still display trust UI (without live retrieval), clearly marked as simulated.

**Acceptance criteria:**
- Demo scenarios ship with pre-generated:
  - ClaimLedger
  - VerificationReport
  - VerificationPlan
- Demo mode:
  - skips retrieval/verification network calls
  - clearly labels outputs as “Demo/Simulated”

### TL‑10.4 — Evidence source health monitoring & status page
**User story:** As a user/operator, I want to know which evidence sources are healthy so I can distinguish “source outage” from “LUMINA failure” and avoid wasting time on runs that can’t retrieve/verify.

**Acceptance criteria:**
- Automated health checks (background job, default every 5 min; configurable):
  - Per source:
    - ClinicalTrials.gov API (fetch known NCT + measure latency)
    - PubMed E‑utilities (search + summary + measure latency)
    - Biology APIs (OpenTargets/ChEMBL/gnomAD where applicable)
  - Health states:
    - 🟢 Healthy: success rate >95% and P95 latency <3s
    - 🟡 Degraded: success rate 80–95% or latency 3–10s
    - 🔴 Down: success rate <80% or latency >10s or repeated connection failures
  - Store last 24h of health datapoints (for trend + incident history).
- Status page (read-only):
  - current status per source + last successful check
  - last 5 errors per source
  - incident history (last 7 days)
- User-facing warnings:
  - warning banner in query input if a required source is degraded/down
  - VerificationReport includes “source health impacted verification” flags when relevant
- Operator alerts:
  - notify on Healthy→Degraded→Down transitions (email/Slack)

**Planned files:**
- New: `server/lib/sourceHealthMonitor.ts`
- New API: `GET /api/sources/health`
- New UI: `src/components/SourceStatusPage.tsx`
- DB table (if using TL‑11.2): `source_health_checks(timestamp, source, status, latency_ms, error)`

---

## Epic TL‑11 — Data persistence + multi-user coordination (Weeks 1–5; file store → DB)

**Goal:** Store all trust artifacts durably with proper isolation and concurrency control so HITL (TL‑5) and audit trails (TL‑6) are real, not aspirational.

### TL‑11.1 — Persistence layer v1 (file-based, development/local)
**User story:** As a developer, I can iterate on trust features without setting up a database.

**Acceptance criteria:**
- Define what “local” means:
  - File-based persistence on the backend runtime (local Express/dev server), not in-memory.
  - Single-user / single-instance only (no multi-tenant guarantees).
- Store per run (directory-per-run layout):
  - `{runId}/evidence-packet.json`
  - `{runId}/claim-ledger.json`
  - `{runId}/verification-report.json`
  - `{runId}/verification-plan.json`
  - `{runId}/audit-log.jsonl` (append-only events)
- Atomic writes:
  - write temp file + fsync + rename (no partial/corrupt artifacts)
- Retention:
  - expire runs after 30 days (configurable)
- Deployment note:
  - file-based store is **not** suitable for serverless environments; production must use TL‑11.2.

**Planned files:**
- New: `src/lib/trust/persistence/fileStore.ts`

### TL‑11.2 — Persistence layer v2 (database, production)
**User story:** As a BD team, multiple users can run analyses concurrently without conflicts, and all runs are retained for audit.

**Acceptance criteria:**
- DB selection:
  - PostgreSQL preferred (production); SQLite acceptable for early MVP.
- Schema supports:
  - immutable run artifacts
  - append-only audit events
  - multi-user isolation by `user_id` (future: org/tenant id)
  - safe concurrent updates for flags/reviews (transactions or optimistic locking)
- Baseline schema (illustrative):
  ```sql
  CREATE TABLE analysis_runs (
    run_id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    mode VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    schema_version VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    cost_usd DECIMAL(10,4)
  );

  CREATE TABLE evidence_packets (
    run_id UUID REFERENCES analysis_runs(run_id),
    packet_json JSONB NOT NULL,
    as_of TIMESTAMP NOT NULL,
    PRIMARY KEY (run_id)
  );

  CREATE TABLE claim_ledgers (
    run_id UUID REFERENCES analysis_runs(run_id),
    ledger_json JSONB NOT NULL,
    PRIMARY KEY (run_id)
  );

  CREATE TABLE verification_reports (
    run_id UUID REFERENCES analysis_runs(run_id),
    report_json JSONB NOT NULL,
    trust_level VARCHAR(20),
    overall_score INT,
    PRIMARY KEY (run_id)
  );

  CREATE TABLE review_flags (
    flag_id UUID PRIMARY KEY,
    run_id UUID REFERENCES analysis_runs(run_id),
    claim_id VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reviewer_id VARCHAR(255),
    reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL
  );

  CREATE INDEX idx_runs_user ON analysis_runs(user_id, created_at DESC);
  CREATE INDEX idx_flags_status ON review_flags(run_id, status);
  ```
- Migration path:
  - provide export/import utility to migrate fileStore artifacts into DB rows
- Multi-tenant isolation (future):
  - row-level security (RLS) / tenant id partitioning

**Planned files:**
- New: `src/lib/trust/persistence/dbStore.ts`
- New: `server/migrations/001_trust_tables.sql`

### TL‑11.3 — Evidence cache coordination (shared cache layer)
**User story:** As the system, when many users query the same evidence (e.g., NCT), I fetch once and share results safely.

**Acceptance criteria:**
- Shared cache backend (preferred Redis; in-memory for MVP).
- Per-cache-key locks to prevent thundering herd.
- Cache stats exposed (hit rate, size, evictions).
- Coordinated TTL eviction across instances.

**Planned files:**
- Update: `src/lib/trust/evidenceCache.ts` to support shared backend + locks

### TL‑11.4 — Backups + disaster recovery + compliance export (v1.1)
**User story:** As an operator/compliance owner, I want reliable backups and restore procedures so diligence artifacts are not lost and audits are supportable.

**Acceptance criteria:**
- Automated backups (DB store):
  - daily backups retained for 30 days (configurable)
  - optional point-in-time recovery (restore to any time in last 7 days)
- Disaster recovery runbook:
  - restore steps validated in staging
  - RTO/RPO targets defined
- Compliance export utility:
  - export all runs (or by date range/org/user) for audit as a bundled archive

**Planned files:**
- New: `scripts/export-runs.ts`

---

## Epic TL‑12 — Batch processing + job queue (Weeks 10–14; optional for v1)

**Goal:** Support real BD operations (portfolio sweeps, competitor scans) without users scripting around the product.

### TL‑12.1 — Batch submission + queue + prioritization
**User story:** As a BD lead, I can submit 20–50 analyses overnight and receive a consolidated summary when complete.

**Acceptance criteria:**
- Batch API:
  - input: CSV with columns `query, mode, priority, metadata`
  - returns: `batch_id` + estimated completion time
- Queue:
  - priority levels: urgent (interactive) > high (batch) > low (background)
  - rate limiting per user/org so one batch doesn’t starve others
  - retry logic with backoff for transient failures
- Progress tracking:
  - endpoint: `GET /api/batches/{batch_id}/status`
  - returns `{completed, failed, pending, estimated_completion}`
- Output:
  - each run stores normal artifacts (TL‑11)
  - batch summary table compares key risks/uncertainties/verification status across runs

**Planned files:**
- New: `server/api/batch.ts`
- New: `src/lib/trust/batchProcessor.ts`

### TL‑12.2 — Notifications (batch completion + high-severity flags)
**User story:** As a user, I want to be notified when my batch completes or when critical verification flags occur.

**Acceptance criteria:**
- Triggers:
  - batch completed
  - urgent run completed
  - high/critical flags detected
- Channels (configurable):
  - email (default)
  - Slack webhook (optional)
  - in-app notification (later)
- No sensitive data in notifications; include links + summary counts only.

**Planned files:**
- New: `server/lib/notifications.ts`

---

## Cross-cutting considerations (track, don’t block early sprints)

- **Security & privacy**:
  - redact secrets/PII/PHI from logs and exports
  - key rotation strategy; least-privilege for any stored artifacts
- **Accessibility**:
  - non-color-only trust indicators; keyboard navigation for evidence drawers
- **Responsive UX**:
  - tablet/iPad layout for diligence workflows
- **Compliance & governance** (customer-driven; plan hooks early):
  - GDPR (data residency, retention, right-to-delete for user data)
  - SOC2-aligned audit logging + access controls (ties to TL‑5.0/TL‑11)
  - HIPAA/PHI handling only if clinical datasets include PHI (default: do not ingest PHI)
  - 21 CFR Part 11 only if integrating into regulated pharma QMS workflows
- **International sources** (later):
  - EMA/PMDA registries and non-English docs; date/locale handling

---

## Non-goals (explicit)

- Building a “vector DB of all biotech knowledge” as a first step.
- Auto-validating efficacy endpoints (ORR/PFS/OS) unless structured results/excerpts are retrieved.
- Deep patent claim charting before the provenance + verification loop exists.

