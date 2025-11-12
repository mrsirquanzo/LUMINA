// Mock conversation data for demo mode
// This allows visitors to see how agents work without API costs

export interface MockConversation {
  query: string;
  response: string;
}

export const DATA_ANALYST_DEMOS: MockConversation[] = [
  {
    query: "Analyze the efficacy endpoints from this Phase 2 trial data. What are the key biomarker trends?",
    response: `I'll analyze the efficacy endpoints and biomarker trends from this Phase 2 trial data.

**Primary Efficacy Endpoints:**

1. **Overall Response Rate (ORR): 68%**
   - Complete Response (CR): 23%
   - Partial Response (PR): 45%
   - Stable Disease (SD): 22%
   - Progressive Disease (PD): 10%

2. **Duration of Response (DOR)**
   - Median DOR: 14.2 months (95% CI: 10.8-18.6)
   - 12-month DOR rate: 58%

**Key Biomarker Trends:**

📊 **PD-L1 Expression Correlation**
- PD-L1 ≥50%: ORR 82% (n=34)
- PD-L1 1-49%: ORR 61% (n=28)
- PD-L1 <1%: ORR 43% (n=18)
- **p-value: 0.018** (statistically significant)

🧬 **Tumor Mutational Burden (TMB)**
- TMB ≥10 mut/Mb: ORR 76% (n=42)
- TMB <10 mut/Mb: ORR 54% (n=38)
- Correlation coefficient: 0.68

**Clinical Significance:**
The strong correlation between PD-L1 expression and response rate suggests this could be a viable biomarker for patient selection. The TMB trend is also promising but needs validation in Phase 3.

**Recommendation:** These endpoints support advancement to Phase 3 with PD-L1 as an enrichment biomarker.`
  },
  {
    query: "Compare the top 3 CAR-T therapies by response rates, durability, and safety profile.",
    response: `Here's a comparative analysis of the top 3 CAR-T therapies:

## 1. Kymriah (tisagenlecleucel) - Novartis

**Response Rates:**
- ORR: 82% in r/r ALL
- CR/CRi: 63%
- Median time to response: 29 days

**Durability:**
- Median DOR: 12.8 months
- 24-month OS: 62%
- Relapse-free survival at 12mo: 55%

**Safety Profile:**
- CRS (all grades): 77%
- CRS (Grade 3-4): 48%
- Neurotoxicity: 40%
- Mortality: 2.8% treatment-related

---

## 2. Yescarta (axicabtagene ciloleucel) - Gilead

**Response Rates:**
- ORR: 72% in DLBCL
- CR: 51%
- Median time to response: 30 days

**Durability:**
- Median DOR: 11.1 months
- 18-month OS: 52%
- Relapse-free survival at 12mo: 42%

**Safety Profile:**
- CRS (all grades): 93%
- CRS (Grade 3-4): 13%
- Neurotoxicity: 64%
- Mortality: 3.3% treatment-related

---

## 3. Breyanzi (lisocabtagene maraleucel) - BMS

**Response Rates:**
- ORR: 73% in r/r LBCL
- CR: 53%
- Median time to response: 30 days

**Durability:**
- Median DOR: 14.8 months
- 18-month OS: 58%
- Relapse-free survival at 12mo: 49%

**Safety Profile:**
- CRS (all grades): 42%
- CRS (Grade 3-4): 2%
- Neurotoxicity: 30%
- Mortality: 0.4% treatment-related

---

## Key Takeaways:

**Best Response Rate:** Kymriah (82%)
**Best Durability:** Breyanzi (14.8 month DOR)
**Best Safety:** Breyanzi (lowest CRS and neurotoxicity)

**Competitive Positioning:** Breyanzi appears to have the best overall profile with strong efficacy and notably superior safety, though head-to-head trials are needed for definitive comparison.`
  },
  {
    query: "What are the approval trends for oncology drugs in 2023-2024? Which indications are hottest?",
    response: `Based on FDA oncology approvals in 2023-2024, here are the key trends:

## 📈 Overall Approval Statistics

**2023:** 16 novel oncology drugs approved
**2024 (YTD):** 9 novel oncology drugs approved
**Average review time:** 9.2 months (down from 10.8 in 2022)

---

## 🔥 Hottest Indications (by # of approvals)

### 1. **Lung Cancer (NSCLC)** - 7 approvals
- ADCs: 2 approvals
- TKIs: 3 approvals
- Immunotherapy combos: 2 approvals
- **Why hot:** Large market, high unmet need in resistant populations

### 2. **Breast Cancer** - 5 approvals
- HER2-low ADCs: 2 approvals
- CDK4/6 combos: 2 approvals
- TROP2-targeted: 1 approval
- **Why hot:** ADC revolution targeting HER2-low patients

### 3. **Hematologic Malignancies** - 4 approvals
- Bispecifics: 2 approvals
- CAR-T expansions: 1 approval
- BTK inhibitors: 1 approval
- **Why hot:** Shift to earlier lines, outpatient bispecifics

---

## 🚀 Emerging Modality Trends

**Antibody-Drug Conjugates (ADCs):** 6 approvals
- Dominant trend: Better linkers, novel payloads
- Key targets: HER2, TROP2, B7-H3

**Bispecific T-cell Engagers:** 4 approvals
- Moving to outpatient settings
- Entering earlier treatment lines

**Targeted Therapies:** 8 approvals
- Precision oncology with companion diagnostics
- Resistance mutations being addressed

**Immunotherapy Combos:** 3 approvals
- IO+IO and IO+targeted pairings

---

## 💡 Investment Implications

**Hot areas for 2024-2025:**
1. ADCs targeting new antigens (CEACAM5, Claudin18.2)
2. Bispecifics in solid tumors
3. Next-gen CAR-T (off-the-shelf, solid tumor penetration)
4. Resistance mechanisms in TKI-treated patients

**Avoid:** Single-agent checkpoint inhibitors (crowded, commoditized)`
  }
];

export const PATENT_EXPERT_DEMOS: MockConversation[] = [
  {
    query: "Analyze the patent landscape for CRISPR gene editing technologies. Who owns the key IP?",
    response: `Here's an analysis of the CRISPR patent landscape and key IP ownership:

## 🔐 Major Patent Holders

### 1. **Broad Institute (MIT/Harvard) - Led by Feng Zhang**

**Key Patents:**
- **US 8,697,359** - CRISPR in eukaryotic cells (foundational)
- **US 8,771,945** - Multi-guide CRISPR systems
- Filing dates: 2012-2013
- **Status:** Granted, broadly covering therapeutic applications

**Scope:** Eukaryotic cell editing (human therapeutics)
**Licensees:** Editas Medicine (exclusive)

---

### 2. **UC Berkeley/University of Vienna - Led by Jennifer Doudna & Emmanuelle Charpentier**

**Key Patents:**
- **US 10,266,850** - General CRISPR-Cas9 methods
- **US 8,697,359** - RNA-guided genome editing
- Filing dates: 2012-2013
- **Status:** Granted after interference proceedings

**Scope:** Broader claims covering all cell types
**Licensees:** Caribou Biosciences, CRISPR Therapeutics, Intellia

---

### 3. **MilliporeSigma (Merck KGaA)**

**Key Patents:**
- **US 10,787,654** - Methods of chromosomal integration
- **US 9,738,908** - CRISPR enzyme modifications
- Filing dates: 2012-2014
- **Status:** Granted, covers commercial use

**Scope:** Proxy IP covering CRISPR integration methods
**Risk:** Potential blocking patents for gene insertion

---

## ⚖️ Patent Dispute History

**Broad vs. Berkeley Interference:**
- 2014-2017: Major patent interference
- **Outcome:** Both parties granted patents with different scopes
- Broad: Eukaryotic applications
- Berkeley: General methods

**Current Status:** Settled, both portfolios valid

---

## 🧬 Technology-Specific IP Ownership

**Base Editing (Single Nucleotide Changes):**
- **Broad Institute** (David Liu)
- US 10,113,163 and family
- Licensed to: Beam Therapeutics

**Prime Editing (Precision insertion/deletion):**
- **Broad Institute** (David Liu)
- US 11,732,274 and family
- Licensed to: Prime Medicine

**Cas12/Cas13 (Alternative enzymes):**
- **UC Berkeley** (Doudna)
- US 10,266,850
- Less crowded, more freedom to operate

---

## 💡 Freedom-to-Operate (FTO) Assessment

**Red Flags:**
- Both Broad and Berkeley have broad composition claims
- MilliporeSigma has blocking integration patents
- Litigation history suggests aggressive enforcement

**Safer Paths:**
1. License from major pools (Broad OR Berkeley)
2. Use alternative enzymes (Cas12a, Cas13)
3. Geographic arbitrage (some patents invalid in Europe)

**Recommendation:** Companies pursuing CRISPR therapeutics should secure licenses from both Broad and Berkeley to avoid infringement risk.`
  },
  {
    query: "What's the patent strategy behind Moderna's mRNA vaccine platform? What are their blocking patents?",
    response: `Here's an analysis of Moderna's mRNA vaccine patent strategy:

## 🛡️ Core Platform Patents

### 1. **Modified Nucleosides (Foundational)**

**Key Patents:**
- **US 8,278,036** - Modified mRNA with pseudouridine
- **Filed:** 2011 (licensed from U Penn/BioNTech)
- **Claims:** Use of pseudouridine to reduce immunogenicity
- **Status:** Granted, expires 2028

**Strategic Importance:** ⭐⭐⭐⭐⭐
- Foundational for all mRNA vaccines
- Reduces innate immune response
- Licensed non-exclusively by most players

---

### 2. **Lipid Nanoparticle (LNP) Delivery**

**Key Patents:**
- **US 10,221,127** - Ionizable lipid formulations
- **Filed:** 2016
- **Claims:** Specific lipid ratios and pH-sensitive formulations
- **Status:** Granted, expires 2036

**Strategic Importance:** ⭐⭐⭐⭐⭐
- Enables efficient cellular delivery
- Blocking patent for competing LNP designs
- Licensed from Acuitas/Arbutus (contentious)

---

### 3. **mRNA Sequence Optimization**

**Moderna-Owned Patents:**
- **US 10,501,512** - Codon-optimized SARS-CoV-2 spike
- **Filed:** 2020 (during pandemic)
- **Claims:** Specific spike protein stabilization mutations
- **Status:** Granted, expires 2040

**Strategic Importance:** ⭐⭐⭐
- Product-specific (COVID vaccine)
- Proline substitutions (S-2P) for stability
- Also claimed by NIH (co-ownership dispute)

---

## ⚔️ Blocking Patent Analysis

**Patents Moderna MUST License:**

1. **BioNTech/Fosun (Katalin Karikó)**
   - Pseudouridine incorporation
   - US 8,278,036, US 8,691,750
   - **License Status:** Non-exclusive, royalty-bearing

2. **Arbutus Pharma**
   - LNP delivery technology
   - US 9,364,435 (ionizable lipids)
   - **License Status:** Contested, ongoing litigation

3. **NIH (U.S. Government)**
   - Spike protein stabilization
   - Co-invented with Moderna scientists
   - **License Status:** Government march-in rights claimed

---

## 🎯 Moderna's Offensive Strategy

**Broad Portfolio Coverage:**
- 500+ mRNA-related patents filed
- Coverage across:
  - Platform technology (LNPs, polyA tails)
  - Disease-specific antigens
  - Manufacturing processes
  - Dosing regimens

**Defensive Moat:**
- Continuation applications filed aggressively
- Trade secrets for manufacturing know-how
- Speed-to-market advantage (regulatory data)

---

## ⚖️ Ongoing Patent Disputes

### 1. **Moderna vs. Pfizer/BioNTech**
- **Dispute:** COVID vaccine sequence optimization
- **Patents:** US 10,703,789 and others
- **Status:** Active litigation in US and Europe
- **Risk:** Could result in cross-licensing or damages

### 2. **Arbutus vs. Moderna**
- **Dispute:** LNP delivery IP
- **Patents:** US 9,364,435
- **Status:** Settled in 2022 (confidential terms)
- **Outcome:** Likely ongoing royalties

---

## 💡 FTO Implications for Competitors

**Clearance Required:**
1. ✅ Modified nucleosides (widely licensed)
2. ⚠️ LNP delivery (limited suppliers: Acuitas, Arcturus)
3. ⚠️ Specific mRNA sequences (depends on target)

**Alternative Paths:**
- Self-amplifying RNA (saRNA) - different IP space
- Circular RNA (circRNA) - emerging, less crowded
- Non-LNP delivery (polymers, exosomes)

**Recommendation:** Conduct comprehensive FTO analysis before mRNA therapeutic development. Consider licensing from established platforms (Moderna, BioNTech) vs. designing around.`
  },
  {
    query: "Compare the ADC patent portfolios of Daiichi Sankyo, AstraZeneca, and Seagen. Who has the strongest position?",
    response: `Here's a comparative analysis of ADC patent portfolios:

## 📊 Portfolio Comparison

### 1. **Daiichi Sankyo**

**Key Patents:**
- **DXd Platform** (Deruxtecan payload)
  - US 9,872,915 - Topoisomerase I inhibitor payloads
  - US 10,155,037 - Cleavable tetrapeptide linkers
  - Filed: 2014-2016
  - Expires: 2034-2036

**Patent Strength:** ⭐⭐⭐⭐⭐
- Novel payload (topoisomerase I derivative)
- Bystander effect enabled
- Multiple layers: payload, linker, conjugation

**Commercial Products:**
- Enhertu (HER2)
- Dato-DXd (TROP2)
- Pipeline: 10+ targets

**Blocking Potential:** HIGH
- DXd payload is proprietary
- Competitors cannot replicate bystander effect

---

### 2. **AstraZeneca (via Daiichi Partnership + Legacy ADC IP)**

**Key Patents:**
- **Acquired from Daiichi:** Co-development of DXd ADCs
- **Legacy Medimmune IP:**
  - US 9,931,417 - Site-specific conjugation
  - US 10,045,991 - Engineered cysteines
  - Filed: 2012-2015

**Patent Strength:** ⭐⭐⭐⭐
- Strong via Daiichi partnership
- Own IP in site-specific conjugation
- Less differentiated payload IP

**Commercial Products:**
- Enhertu (co-marketed with Daiichi)
- Imfinzi (IO, not ADC but combo potential)

**Blocking Potential:** MEDIUM-HIGH
- Access to DXd via partnership
- Own conjugation methods differentiated

---

### 3. **Seagen (Now part of Pfizer)**

**Key Patents:**
- **MMAE/MMAF Payloads:**
  - US 7,659,241 - Auristatin derivatives
  - Expires: 2024-2026 (⚠️ expiring soon!)
- **Cleavable Linkers:**
  - US 7,829,531 - Valine-citrulline dipeptide
  - Expires: 2024-2027
- **Site-Specific Conjugation:**
  - US 9,562,098 - Engineered cysteine conjugation
  - Filed: 2015, Expires: 2035

**Patent Strength:** ⭐⭐⭐
- Legacy IP expiring (payload cliff)
- Strong linker IP but being designed around
- Newer site-specific IP still valuable

**Commercial Products:**
- Adcetris (MMAE, expiring IP)
- Padcev (MMAE)
- Tivdak (MMAE)

**Blocking Potential:** MEDIUM (declining)
- MMAE payloads going generic
- Linker IP being circumvented by competitors

---

## 🏆 Strongest Position: Daiichi Sankyo

### Why Daiichi Leads:

1. **Novel Payload with Long Patent Life**
   - DXd platform expires 2034-2036
   - Unique mechanism (bystander effect)
   - Competitors cannot easily design around

2. **Multiple Layers of Protection**
   - Payload composition
   - Linker chemistry
   - Drug-antibody ratio (DAR)
   - Manufacturing processes

3. **Proven Clinical Success**
   - Enhertu: Blockbuster ($2B+ sales)
   - Pipeline: 10+ DXd-based ADCs in development
   - Regulatory validation (FDA/EMA approvals)

4. **Licensing Leverage**
   - AstraZeneca partnership validates IP
   - Merck, others seeking DXd access
   - Royalty stream potential

---

## ⚠️ Weaknesses by Company

**Daiichi Sankyo:**
- Over-reliance on DXd (single platform risk)
- Patent challenges possible as competitors develop alternatives

**AstraZeneca:**
- Dependent on Daiichi for DXd access
- Limited proprietary payload IP
- Split economics with Daiichi

**Seagen (Pfizer):**
- Payload patent cliff (2024-2026)
- MMAE going generic
- Need to pivot to next-gen payloads

---

## 💡 Competitive Landscape Implications

**For Competitors:**
- **Must-license:** Daiichi's DXd platform for best-in-class ADCs
- **Design-around:** Seagen's expiring MMAE patents (opportunity)
- **Avoid:** Direct copying of Daiichi's payload structure

**For Investors:**
- **Bullish:** Daiichi Sankyo (strongest IP moat)
- **Neutral:** AstraZeneca (access via partnership, limited upside)
- **Bearish:** Legacy Seagen ADCs (IP expiration cliff)

**Recommendation:** Daiichi Sankyo has the strongest ADC patent position with long-lived, differentiated IP that is difficult to design around. Their DXd platform represents a 10-15 year competitive moat.`
  }
];

export const FINANCIAL_ANALYST_DEMOS: MockConversation[] = [
  {
    query: "Analyze Regeneron's latest quarterly financials. What's their runway and burn rate?",
    response: `Here's my analysis of Regeneron's Q3 2024 financials:

## 💰 Income Statement Highlights

**Revenue: $3.85B** (↑11% YoY)
- EYLEA/EYLEA HD: $1.62B (↓8% YoY due to biosimilar competition)
- Dupixent (collaboration): $3.54B global (↑26% YoY)
  - Regeneron's share: $1.42B
- Libtayo: $301M (↑37% YoY)
- Other: $476M

**Operating Expenses:**
- R&D: $1.18B (30.6% of revenue)
- SG&A: $624M (16.2% of revenue)
- Total OpEx: $1.80B

**Profitability:**
- Operating Income: $2.05B (53% margin)
- Net Income: $1.67B
- EPS: $15.20 (diluted)

---

## 💵 Balance Sheet Analysis

**Cash & Equivalents:** $8.92B
**Marketable Securities:** $7.85B
**Total Liquid Assets: $16.77B**

**Total Debt:** $2.10B
**Net Cash: $14.67B**

**Shareholders' Equity:** $24.3B

---

## 🔥 Burn Rate & Runway Analysis

**Quarterly Cash Flow:**
- Operating Cash Flow: $2.31B
- CapEx: $187M
- Free Cash Flow (FCF): $2.12B/quarter

**Annualized Metrics:**
- Annual FCF: ~$8.5B
- R&D Spend: ~$4.7B/year
- Net Cash Generation: +$8.5B/year

---

## 🎯 Runway Assessment

**Runway: N/A (Cash Generative)**

Regeneron is **highly profitable** and generates substantial positive cash flow. They are not burning cash—they're printing it.

**Key Metrics:**
- **Cash Conversion:** 55% of revenue → FCF
- **R&D Efficiency:** $1.18B/quarter supports 30+ programs
- **Debt/Equity:** 0.09 (very low leverage)
- **Current Ratio:** 4.2 (excellent liquidity)

---

## 📊 Financial Health Score: A+

**Strengths:**
✅ Diversified revenue (Dupixent growth offsets EYLEA decline)
✅ Strong profitability (53% operating margin)
✅ Massive cash generation ($8.5B FCF annually)
✅ Low debt burden
✅ Robust R&D pipeline funding

**Risks:**
⚠️ EYLEA biosimilar erosion (-8% YoY)
⚠️ Dupixent patent expiration (2031 in US)
⚠️ Dependence on Sanofi partnership (Dupixent)

---

## 💡 Investment Implications

**Valuation Metrics:**
- Market Cap: ~$110B
- P/E Ratio: 18.2x (trailing)
- EV/Sales: 7.8x
- FCF Yield: 7.7%

**Compared to Peers:**
- Amgen: P/E 17.5x
- Vertex: P/E 22.1x
- Biogen: P/E 14.8x

**Verdict:** Regeneron is **fairly valued** with strong fundamentals. The 7.7% FCF yield is attractive, and the Dupixent growth runway extends to 2030+.

**Recommendation:** HOLD / Accumulate on dips. Strong financial position supports continued pipeline investment and shareholder returns (buybacks/dividends).`
  },
  {
    query: "Value a preclinical biotech with promising CAR-T data. What multiples should I use?",
    response: `Let me walk through a valuation framework for a preclinical CAR-T biotech:

## 🧬 Assumed Company Profile

**Stage:** Preclinical CAR-T candidate
**Indication:** Relapsed/refractory B-cell NHL (non-Hodgkin lymphoma)
**Data:** Promising ORR in xenograft models (70%+)
**IND Filing:** Expected in 6-9 months
**Cash:** $80M (18-month runway)
**Employee Count:** 35 FTEs

---

## 📊 Valuation Methodologies

### 1. **Risk-Adjusted NPV (rNPV)**

**Assumptions:**
- Peak sales: $1.2B (mature CAR-T market, competitive)
- Probability of success (PoS):
  - IND → Phase 1: 70%
  - Phase 1 → Phase 2: 40%
  - Phase 2 → Phase 3: 50%
  - Phase 3 → Approval: 75%
  - **Overall PoS: 10.5%**

**DCF Calculation:**
- Peak sales: $1.2B (Year 10 post-approval)
- Peak margin: 60% (CAR-T economics)
- EBITDA: $720M
- Terminal multiple: 10x EBITDA
- Terminal value: $7.2B

**Risk-Adjusted NPV:**
- NPV (unrisked): $4.8B
- PoS adjustment: 10.5%
- **rNPV: ~$500M**

**Implied Valuation: $400-600M**

---

### 2. **Comparable Company Analysis**

**Preclinical CAR-T Biotechs (Recent Financings):**

| Company | Stage | Indication | Valuation | Data |
|---------|-------|-----------|-----------|------|
| Company A | Preclinical | NHL | $350M | Strong preclinical |
| Company B | IND-ready | Solid tumor | $480M | First-in-class |
| Company C | Phase 1 | Multiple myeloma | $720M | Early Phase 1 data |

**Median Multiple:**
- Preclinical: $300-400M
- IND-ready: $400-600M
- Early Phase 1: $600-900M

**Implied Range: $350-500M**

---

### 3. **Acquisition Precedent Analysis**

**Recent CAR-T Acquisitions (Preclinical/Phase 1):**

- **Allogene/Cellectis IP**: $400M upfront (2024)
- **Kite/Tmunity**: $275M upfront (2023)
- **Precision/Juno (subset)**: ~$350M for early pipeline (2022)

**Median Upfront: $300-400M**
**Total Deal Value (w/ milestones): $800M-1.2B**

---

## 🎯 Recommended Valuation Approach

**Base Case: $400M Pre-Money**

**Rationale:**
- rNPV: $500M (10.5% PoS)
- Comps: $350-500M range
- Precedents: $300-400M upfronts

**Sensitivity Analysis:**

| Scenario | PoS | Peak Sales | Valuation |
|----------|-----|------------|-----------|
| Bear | 8% | $800M | $280M |
| Base | 10.5% | $1.2B | $400M |
| Bull | 15% | $1.8B | $720M |

---

## 💰 Financing Structure Recommendations

**Series B Raise: $100M at $400M pre**
- Post-money: $500M
- Dilution: 20%
- Cash runway: 30-36 months (through Phase 1 data)

**Investor Return Scenarios:**

**Exit via Acquisition (Year 5):**
- Phase 2 success → $2B acquisition
- Investor return: 4x MOIC
- IRR: ~32%

**Exit via IPO (Year 6):**
- Phase 2b data readout
- IPO at $1.5B valuation
- Investor return: 3x MOIC
- IRR: ~25%

---

## 📌 Key Valuation Drivers

**Upside Catalysts:**
- ✅ Positive IND feedback (de-risks to 15% PoS)
- ✅ Orphan drug designation (pricing power)
- ✅ Strategic partnership (validation premium)
- ✅ Differentiated safety profile (vs. Kymriah/Yescarta)

**Downside Risks:**
- ⚠️ Manufacturing challenges (CAR-T scale-up)
- ⚠️ CRS toxicity in clinic
- ⚠️ Competitive landscape (crowded NHL space)
- ⚠️ Regulatory delays

---

## 💡 Final Recommendation

**Fair Value Range: $350-500M**
**Midpoint: $400M pre-money**

**Recommended Multiples:**
- **EV/Peak Sales:** 0.3-0.4x (risk-adjusted)
- **EV/EBITDA:** Not applicable (pre-revenue)
- **P/S (peak):** 0.4x (post PoS adjustment)

**Investment Thesis:**
At $400M, investors pay ~0.33x peak sales (risk-adjusted), which is reasonable for preclinical CAR-T with promising data. The 18-month runway necessitates a $100M+ raise to reach Phase 1 data, which should drive significant re-rating if successful.`
  },
  {
    query: "Compare the M&A premiums for recent ADC acquisitions. What are buyers paying per asset?",
    response: `Here's an analysis of recent ADC M&A premiums and per-asset valuations:

## 🏢 Major ADC Acquisitions (2022-2024)

### 1. **Pfizer → Seagen** (2023)

**Deal Terms:**
- **Purchase Price:** $43B
- **Premium:** 33% to pre-announcement price
- **Per Share:** $229

**Asset Breakdown:**
- **Commercial ADCs:**
  - Adcetris (approved): ~$1.2B sales
  - Padcev (approved): ~$800M sales
  - Tivdak (approved): ~$250M sales
  - **Total Revenue:** ~$2.25B

- **Pipeline ADCs:** 5 clinical-stage candidates
  - Disitamab vedotin (Phase 3)
  - Ladiratuzumab vedotin (Phase 2)
  - Others in Phase 1/2

**Valuation Metrics:**
- EV/Sales: 19.1x (commercial products)
- Per Asset: ~$5.4B per approved ADC
- Pipeline value: ~$3B per Phase 3 asset

---

### 2. **AbbVie → ImmunoGen** (2023)

**Deal Terms:**
- **Purchase Price:** $10.1B
- **Premium:** 95% to pre-announcement price
- **Per Share:** $31.26

**Asset Breakdown:**
- **Commercial ADC:**
  - Elahere (approved 2022): ~$350M sales (2023)

- **Pipeline:**
  - Pivekimab sunirine (Phase 3)
  - IMGC936 (Phase 1)

**Valuation Metrics:**
- EV/Sales: 28.9x (Elahere)
- Per Approved Asset: $10.1B (single product)
- Premium driven by: Peak sales potential ($2B+)

---

### 3. **J&J → Ambrx** (2024)

**Deal Terms:**
- **Purchase Price:** $2.0B upfront + $1.2B milestones = $3.2B
- **Premium:** 104% to pre-announcement price
- **Per Share:** $28.00

**Asset Breakdown:**
- **Pipeline Only (no approved products):**
  - ARX517 (PSMA-targeted, Phase 2)
  - ARX788 (HER2-targeted, Phase 2)
  - Preclinical candidates

**Valuation Metrics:**
- Per Phase 2 Asset: ~$1.6B (upfront + milestones)
- Premium for: Site-specific conjugation platform

---

### 4. **Gilead → Immunomedics** (2020)

**Deal Terms:**
- **Purchase Price:** $21B
- **Premium:** 108% to pre-announcement price

**Asset Breakdown:**
- **Commercial:**
  - Trodelvy (TROP2): Just approved
  - Current sales: ~$2B (2023)

**Valuation Metrics:**
- Per Approved Asset: $21B
- Peak sales expectation: $4-5B

---

## 📊 Premium Analysis Summary

| Deal | Price | Premium | EV/Sales | Per Asset |
|------|-------|---------|----------|-----------|
| Pfizer/Seagen | $43B | 33% | 19.1x | $5.4B (approved) |
| AbbVie/ImmunoGen | $10.1B | 95% | 28.9x | $10.1B |
| J&J/Ambrx | $3.2B | 104% | N/A | $1.6B (Phase 2) |
| Gilead/Immunomedics | $21B | 108% | N/A | $21B |

---

## 💰 Valuation Benchmarks by Stage

### **Approved ADCs:**
- **Range:** $5-21B per asset
- **Median:** $10B
- **Key Driver:** Peak sales potential
  - $1-2B peak: ~$5-8B valuation
  - $2-4B peak: ~$10-15B valuation
  - $4B+ peak: ~$20B+ valuation

### **Phase 3 ADCs:**
- **Range:** $2-5B
- **Median:** $3B
- **PoS Adjusted:** Assumes 70% approval probability

### **Phase 2 ADCs:**
- **Range:** $1-2.5B
- **Median:** $1.6B
- **PoS Adjusted:** Assumes 30-40% Phase 3+ success

### **Phase 1 / Preclinical:**
- **Range:** $300M-800M
- **Median:** $500M
- **Highly Variable:** Depends on target, linker tech, payload novelty

---

## 🎯 Key Premium Drivers

**High Premiums (80-100%+):**
1. First-in-class target (TROP2 for Immunomedics)
2. Breakthrough clinical data
3. Orphan drug potential
4. Platform technology value
5. Competitive bidding situation

**Lower Premiums (30-50%):**
1. Mature product portfolio (Seagen)
2. Limited pipeline beyond lead asset
3. Expiring IP (Seagen's MMAE patents)
4. Pre-emptive deal (no auction)

---

## 💡 Implications for Valuation

**Rule of Thumb:**
- **$1B peak sales** = $5-10B acquisition value
- **Phase 3 asset** = $2-4B
- **Phase 2 asset** = $1-2B
- **Novel payload/linker** = +30-50% premium

**Strategic Buyers Pay More:**
- Big Pharma: 20-50% premium for strategic fit
- Financial Buyers (PE): Prefer approved products, lower premiums

**ADC Platform Premium:**
- Proprietary linker/payload: +$1-3B
- Site-specific conjugation: +$500M-1B
- Manufacturing capabilities: +$500M

---

## 📈 Trend Analysis

**2023-2024 Trends:**
- ✅ Premiums increasing (median: 80%+)
- ✅ Buyers paying for pipeline, not just approved products
- ✅ Platform technology highly valued
- ⚠️ Crowding in ADC space may compress future premiums

**Recommendation:**
ADC companies with Phase 2+ assets should expect $1.5-3B valuations. Approved ADCs with $1B+ sales command $8-15B, depending on peak sales trajectory and patent life. Sellers should run competitive processes to maximize premiums—single-bidder deals average 30-40% lower valuations.`
  }
];

// Helper function to get a random demo response
export function getRandomDemo(agentType: 'data-analyst' | 'patent-expert' | 'financial-analyst'): MockConversation {
  const demos = {
    'data-analyst': DATA_ANALYST_DEMOS,
    'patent-expert': PATENT_EXPERT_DEMOS,
    'financial-analyst': FINANCIAL_ANALYST_DEMOS,
  };

  const agentDemos = demos[agentType];
  return agentDemos[Math.floor(Math.random() * agentDemos.length)];
}
