## TROP2 Fact Audit (Baseline Structured Tiles vs Demo Agent Text)

### Purpose
This document flags **factual mismatches** between:
- **Baseline structured data** used by TROP2 Scientist/Scout dashboards (`src/constants/index.ts`)
- **Demo multi-agent text** for TROP2 (`src/lib/demoMultiAgentScenarios.ts` → `DEMO_TROP2_ANALYSIS`)

**Goal**: remove/repair any claim that is **not supported by the demo agent text** and/or is internally inconsistent, to achieve **zero-tolerance accuracy** for pitch/demo.

---

## 1) High-Risk Mismatches (Must Fix)

### 1.1 Normal tissue expression (Skin / mucosa)
- **Baseline structured tiles claim (Scientist)**
  - Executive summary / risks include **“on-target toxicity in skin/mucosa (high normal expression)”**
    - `src/constants/index.ts` (`SCIENTIST_EXECUTIVE_SUMMARY`) includes:
      - “Key risks include on-target toxicity in skin/mucosa…” (and “high normal expression”) and explicit tissue values in `EXPRESSION_DATA` / `SAFETY_DATA`.
  - `EXPRESSION_DATA.gtexNormalTissues` includes **Skin 245 TPM** and **Esophagus Mucosa 198 TPM**
  - `SAFETY_DATA.expressionConcerns` repeats “High (245 TPM)” skin and “High (198 TPM)” GI mucosa.

- **Demo agent text claim**
  - Target Biology Specialist text states **low normal tissue expression** and does **not** mention skin/mucosa specifically.
  - `DEMO_TROP2_ANALYSIS` (Target Biology → Expression Analysis) says:
    - “Low normal tissue expression enables favorable safety profile”
    - “TROP2 expressed at low levels in most normal tissues”

- **Verdict**
  - **Direct contradiction**: baseline asserts “high normal expression in skin/mucosa”, demo asserts “low normal expression in most normal tissues”.
  - Baseline also uses **specific TPM values** not present in demo text.

- **Recommended fix options**
  - **Strict demo-aligned mode (fastest, safest for internal consistency)**:
    - Remove skin/mucosa “high expression” claims from baseline tiles and replace with the demo wording (“low expression in most normal tissues”) *only if we can externally verify this is true*.
  - **Evidence-locked mode (preferred for “no room for error”)**:
    - Remove all **unverified TPM values** and **absolute claims** (high/low) until we can cite a source.
    - Replace with conservative, demo-supported statements grounded in observed safety (e.g., Dato-DXd stomatitis; Trodelvy diarrhea/neutropenia), and optionally link to GTEx gene page.

---

### 1.2 Trodelvy safety rates mismatch
- **Baseline structured tiles**
  - `SAFETY_DATA.classSafetyHistory` lists Trodelvy:
    - “Neutropenia (51% all grades…) diarrhea (59% all grades…)”
- **Demo clinical agent text**
  - Clinical Data Analyst lists Trodelvy:
    - Neutropenia **64% any grade**, diarrhea **65% any grade**

- **Verdict**
  - **Numeric mismatch** between baseline tile and demo clinical text.

- **Recommended fix**
  - Choose a single source-of-truth and normalize both structured + demo text to match it (ideally, replace both with a cited number, or remove hard percentages if not fully verified).

---

### 1.3 Dato-DXd development status mismatch (and high-risk claim)
- **Baseline structured tiles**
  - `DRUGGABILITY_DATA.existingCompounds` describes Dato-DXd as **Phase 3**.
  - Scout competitive landscape describes Dato-DXd as **Phase 3**.
- **Demo agent text**
  - Target Biology + Clinical text repeatedly states **Dato-DXd is FDA-approved (Dec 2024)** (and includes specific BLA IDs).

- **Verdict**
  - **Direct contradiction** between baseline and demo text.
  - Additionally, the **FDA approval claim must be verified** against an authoritative public source before we can ship it as “fact”.

- **Recommended fix**
  - Treat “Dato-DXd FDA-approved” as **unverified** until confirmed; downgrade text to **investigational / late-stage** (or remove the date) across both structured + demo.

---

## 2) Internal Consistency Issues (Baseline structured data contradicts itself)

### 2.1 Fold-change mismatch
- `SCIENTIST_EXECUTIVE_SUMMARY` cites “8.2x fold-change in TNBC”
- `EXPRESSION_DATA.foldChangeData` includes TNBC fold-change **21.2**

**Verdict**: baseline contains inconsistent numeric claims; must standardize or remove.

---

## 3) Next Steps (Recommended Process)

### A) Build a “Fact Lock” workflow
For each numeric or absolute claim shown in baseline tiles:
- **Attach a source** (demo agent excerpt + line reference OR a real citation link).
- If source missing → **remove the number** or replace with conservative qualitative language.

### B) Apply “Verified-only” rules
- No hard percentages / TPM / dates unless:
  1) present in the demo agent output **and**
  2) the demo agent output cites a real source we can check **or**
  3) we add explicit citations in `src/constants/index.ts` (link/PMID/DOI/GTEx) and expose them in UI.

---

## Appendix: Primary Files
- Baseline structured data: `src/constants/index.ts`
- Demo agent text: `src/lib/demoMultiAgentScenarios.ts` (`DEMO_TROP2_ANALYSIS`)


