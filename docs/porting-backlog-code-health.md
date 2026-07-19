# Porting backlog: `chore/code-health-cleanup`

The local branch `chore/code-health-cleanup` (16 commits, ~3 weeks old as of 2026-07-18) was cut from a **diverged lineage** - its base is not an ancestor of the current `main` (which came from the `design/dashboard-polish` rebuild).
So do **not** merge it wholesale; cherry-pick the items below individually, expect conflicts, and verify each E2E before landing.
Nothing here is demo-blocking; this is a deliberate post-interview harvest.

## Worth porting (missing from main)

- `6234ec5` feat(llm): OpenAI-compatible client for open-weights endpoints - lets LUMINA drive Groq/vLLM/etc.
- `9b07c08` feat(digest): split per-item vs synthesis onto small/mid open models - cost/quality routing.
- `b0611dc` perf(digest): compact item payload (~40% fewer input tokens) - real token saving.
- `e1a6f43` feat(digest): flag ungrounded `[source:id]` citations - light trust layer, on-thesis.
- `d00d3ec` feat(intelligence): demo/live provenance badge on the feed (`FeedProvenanceBadge.tsx`).
- `5c292bd` fix(feed): treat news as optional so rate-limits don't mark the feed partial.
- `6071ca3` fix(feed): show publication month for future-dated items instead of "in 1 month".
- `ea1840b` fix(server): load dotenv before any module reads `process.env` - env-ordering correctness.

## Skip (already handled or lineage-specific)

- `54e9cef` `/api/ready` Live-mode gate - **non-issue in main**: Live starts on `SONNY_BACKEND || 'ollama'` and never checks `/api/ready`, so cloud keys don't block it.
- `1c28297` / large dead-code purge - main's rebuild already dropped most of it (e.g. `OrchestrationStatusPanel`).
- `ccb9113`, `ecd7064` package-lock / server-typecheck gating - tied to the old lineage's build.

## How to harvest

```
git log --oneline main..chore/code-health-cleanup   # confirm still present
git cherry-pick <sha>                                # one at a time, on a fresh branch
```

Branch is local-only (no remote). Keep it until these are ported, then delete.
