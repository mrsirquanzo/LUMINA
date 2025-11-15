/**
 * Test file for PDF export functionality
 *
 * This file demonstrates all the features of the PDF export system:
 * - UTF-8 character encoding (✓, ✗, →, ⚠, ★)
 * - Table formatting
 * - Page break management
 * - Typography hierarchy
 * - Professional styling
 */

import { ChatMessage, exportToPDF } from './pdfExport';

// Test message with special characters
const testMessages: ChatMessage[] = [
  {
    role: 'user',
    content: `Analyze the following biotech companies and provide a comprehensive comparison:

- AbSci Corporation ✓
- Moderna ✗
- BioNTech → Strong candidate
- CureVac ⚠ Risk factors

Please include market data and financial metrics.`,
    timestamp: new Date('2025-11-15T10:00:00'),
  },
  {
    role: 'assistant',
    content: `# Executive Summary

I've completed a comprehensive analysis of the biotech companies you requested. Here's the detailed breakdown:

## Key Findings ✓

The biotech sector shows strong growth potential, with several key indicators:

- Market cap growth: 15-25% YoY
- R&D investment: $2.5B average
- Pipeline strength: ★★★★ (4/5 stars)
- Regulatory risk: ⚠ Moderate to High

## Company Comparison

### AbSci Corporation ✓

**Strengths:**
- AI-driven drug discovery platform
- Strong partnership with major pharma companies
- Proprietary E. coli expression system
- Revenue growth: 45% YoY

**Weaknesses:**
- Limited commercial products
- High R&D burn rate
- Dependency on partnership revenue

**Financial Metrics:**

| Metric | Value | Change YoY |
|--------|-------|------------|
| Market Cap | $1.2B | +32% ✓ |
| Revenue | $15.3M | +45% ✓ |
| R&D Spending | $42.1M | +28% |
| Cash Position | $156M | -12% ⚠ |
| Burn Rate | $8M/quarter | +15% ⚠ |

### Moderna ✗

**Note:** Currently not recommended due to:
1. Post-COVID revenue decline → -65% YoY
2. Pipeline uncertainty
3. High valuation relative to fundamentals

**Key Concerns:**
- COVID vaccine revenue dropping significantly
- Limited commercial products beyond COVID
- High operating expenses
- Market saturation in mRNA space

### BioNTech → Strong Candidate

**Investment Thesis:**
BioNTech represents a strong investment opportunity due to:

1. **Diversified Pipeline**
   - 20+ programs in clinical development
   - Oncology focus (not just vaccines)
   - Partnership with Pfizer for global reach

2. **Financial Strength**
   \`\`\`
   Cash & Equivalents: $17.3B
   Quarterly Revenue: $1.2B
   Operating Margin: 35%
   \`\`\`

3. **Technology Platform**
   - mRNA technology with broad applications
   - Cancer immunotherapy programs
   - Infectious disease pipeline

**Risk Factors:** ⚠
- Regulatory approval timelines
- Competition in oncology space
- Patent expiration concerns

### CureVac ⚠ Risk Factors

**High Risk Profile:**

CureVac has struggled since COVID vaccine failure. Major concerns include:

**Critical Issues:**
• Failed COVID vaccine trial (Phase 3)
• Pipeline delays in other programs
• Partnership losses (GSK withdrawal)
• Limited cash runway (~18 months)
• Management turnover

**Financial Distress Indicators:**

| Indicator | Status | Severity |
|-----------|--------|----------|
| Burn Rate | $50M/quarter | Critical ⚠ |
| Cash Runway | 18 months | High Risk ⚠ |
| Revenue | Minimal | Critical ⚠ |
| Market Cap | $800M | -75% from peak |

## Comparative Analysis

### Market Position Comparison

Here's how these companies stack up across key dimensions:

| Company | Technology | Pipeline | Financial | Risk | Score |
|---------|------------|----------|-----------|------|-------|
| AbSci | ★★★★ | ★★★ | ★★★ | ⚠ Medium | 8/10 |
| Moderna | ★★★★ | ★★ | ★★★ | ⚠ High | 6/10 |
| BioNTech | ★★★★★ | ★★★★ | ★★★★★ | ✓ Low | 9/10 |
| CureVac | ★★ | ★ | ★ | ⚠ Critical | 3/10 |

### Investment Recommendations

Based on this comprehensive analysis, here are the recommended actions:

**Strong Buy → BioNTech**
- Diversified revenue streams
- Strong balance sheet
- Proven technology platform
- Multiple value drivers beyond COVID

**Moderate Buy → AbSci**
- Innovative technology
- Strong partnerships
- Early stage with high upside
- Accept higher risk for potential returns

**Hold/Monitor → Moderna**
- Wait for pipeline developments
- Monitor COVID vaccine sales trends
- Reassess in 6 months

**Avoid ✗ CureVac**
- Too many red flags
- Limited runway
- Pipeline setbacks
- Better opportunities elsewhere

## Key Metrics Summary

### Revenue Comparison (TTM)

\`\`\`
BioNTech:  $21.3B  ✓ (Strong)
Moderna:   $13.2B  ⚠ (Declining)
AbSci:     $15.3M  → (Growing)
CureVac:   $4.2M   ✗ (Weak)
\`\`\`

### R&D Efficiency Ratio

Companies are ranked by R&D spending efficiency (pipeline value / R&D spend):

1. BioNTech: 8.2x ✓
2. Moderna: 3.1x
3. AbSci: 1.8x →
4. CureVac: 0.4x ⚠

## Risk Assessment Matrix

### Regulatory Risks

Each company faces different regulatory challenges:

**AbSci:**
- Dependency on partners for clinical trials
- Novel platform may face regulatory scrutiny
- Timeline uncertainty for first commercial product

**BioNTech:**
- Generally strong regulatory track record
- Established relationships with FDA/EMA
- Lower risk profile ✓

**Moderna:**
- Proven regulatory success with COVID vaccine
- Oncology programs in early stages
- Moderate risk ⚠

**CureVac:**
- Failed COVID trial creates regulatory headwinds
- Need to rebuild credibility
- High risk for future approvals ⚠

## Conclusion

This analysis reveals a clear differentiation among the companies:

**Top Tier:** BioNTech stands out with superior fundamentals, diversified pipeline, and strong financial position.

**Growth Play:** AbSci offers high-risk/high-reward opportunity for investors willing to accept development-stage risk.

**Wait and See:** Moderna needs to prove its pipeline beyond COVID before recommending accumulation.

**Avoid:** CureVac has too many structural issues and limited time to resolve them.

## Special Characters Test ✓

This section tests proper rendering of various symbols:

→ Arrows and directional indicators
✓ Checkmarks for positive indicators
✗ X marks for negative indicators
⚠ Warning symbols for risk factors
★ Stars for ratings (★★★★★)
• Bullet points for lists
– En dashes for ranges (2025–2030)
— Em dashes for emphasis
"Smart quotes" for 'professional' typography

All symbols should render correctly in the PDF export! ✓`,
    timestamp: new Date('2025-11-15T10:15:00'),
    cost: 0.47
  },
  {
    role: 'user',
    content: 'Can you provide more detail on the BioNTech oncology pipeline?',
    timestamp: new Date('2025-11-15T10:20:00')
  },
  {
    role: 'assistant',
    content: `# BioNTech Oncology Pipeline Deep Dive

## Overview ✓

BioNTech's oncology pipeline represents one of the most comprehensive and innovative approaches to cancer treatment using mRNA technology.

### Pipeline Structure

| Program | Indication | Phase | Status | Expected Timeline |
|---------|------------|-------|--------|-------------------|
| BNT111 | Melanoma | Phase 2 | Active ✓ | 2026 readout |
| BNT112 | Prostate Cancer | Phase 2 | Active ✓ | 2026 readout |
| BNT113 | HPV+ Cancers | Phase 2 | Active ✓ | 2025 readout |
| BNT114 | Triple-negative Breast | Phase 1 | Recruiting → | 2027 readout |
| BNT115 | Ovarian Cancer | Phase 1 | Active → | 2027 readout |
| BNT116 | NSCLC | Phase 1 | Active → | 2026 readout |

### Mechanism of Action

BioNTech's approach uses personalized neoantigen vaccines:

1. **Patient Tumor Sequencing** → Identify unique mutations
2. **mRNA Design** → Create personalized vaccine
3. **Immune Activation** → T-cells target cancer cells
4. **Combination Therapy** → Often paired with checkpoint inhibitors

This represents a paradigm shift in oncology treatment! ✓

### Key Partnerships

- **Genentech/Roche:** Co-development of multiple programs
- **Genmab:** CAR-T and antibody combinations
- **OncoC4:** Bispecific antibodies
- **Memorial Sloan Kettering:** Clinical research

### Competitive Advantages ★★★★★

**Technology Platform:**
- Rapid vaccine design (6-8 weeks)
- Scalable manufacturing
- Proven safety profile from COVID vaccines
- Personalized medicine approach

**Clinical Data:**
- Encouraging Phase 1/2 results
- Strong combination therapy data
- Acceptable safety profile
- Durable responses observed

### Investment Implications

The oncology pipeline provides multiple shots on goal:

✓ Diversification beyond COVID
✓ Large addressable markets ($50B+ TAM)
✓ First-mover advantage in mRNA oncology
✓ Strong intellectual property position

This is a major value driver for the company! → Strong Buy recommendation maintained.`,
    timestamp: new Date('2025-11-15T10:25:00'),
    cost: 0.32
  }
];

// Function to run the test
export function runPDFExportTest() {
  console.log('Starting PDF Export Test...');
  console.log(`Testing with ${testMessages.length} messages`);
  console.log('Special characters included: ✓ ✗ → ⚠ ★');

  exportToPDF(testMessages, 'Multi-Agent Biotech Analysis');

  console.log('✓ Test complete! Check downloaded PDF for:');
  console.log('  - Proper UTF-8 encoding of special characters');
  console.log('  - Table formatting and borders');
  console.log('  - Page breaks (should be clean)');
  console.log('  - Typography hierarchy (H1, H2, H3)');
  console.log('  - Professional spacing and margins');
  console.log('  - Minimal headers/footers');
  console.log('  - Code block formatting');
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).runPDFExportTest = runPDFExportTest;
  (window as any).testMessages = testMessages;
}
