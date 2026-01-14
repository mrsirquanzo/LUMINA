# TROP2 Agent Attribution & Enhancement Planning

**Date:** 2025-01-27  
**Purpose:** Plan agent attribution system for TROP2 baseline tiles and compare with demo scenario data  
**Status:** Planning Phase - No Implementation Yet

---

## 🎯 Executive Summary

**Goal:** Add agent attribution to TROP2 baseline tiles to show which agents generated each tile's data, creating a visual connection between the multi-agent orchestration system and the dashboard tiles. This will enhance user understanding of the collaborative intelligence system.

**Key Insight:** Currently, TROP2 baseline tiles are static constants with no agent attribution. Demo scenarios show agent responses but tiles are dynamically generated. We need to bridge this gap by adding agent metadata to baseline tiles.

---

## 📊 Current State Analysis

### TROP2 Baseline Tiles (Current)

**Location:** `src/constants/index.ts`

**Characteristics:**
- ✅ **Rich structured data** (TypeScript objects with arrays, nested data)
- ✅ **Specialized tile components** (ExpressionBiologyTile, ClinicalPrecedentTile, etc.)
- ✅ **Interactive visualizations** (charts, filters, tabs)
- ❌ **No agent attribution** - tiles don't show which agents generated them
- ❌ **No agent metadata** - data constants don't include agent information

**Example - Executive Summary:**
```typescript
export const SCIENTIST_EXECUTIVE_SUMMARY = {
  overallScore: 82,
  recommendation: 'Advance',
  // ... data fields
  // ❌ No agent attribution
};
```

**Rendered as:**
```tsx
<ExecutiveSummaryTile data={SCIENTIST_EXECUTIVE_SUMMARY} loading={loading} />
```

### Demo Scenario Tiles (Current)

**Location:** `src/lib/demoMultiAgentScenarios.ts`

**Characteristics:**
- ✅ **Agent attribution** - each response has `agent: 'Target Biology Specialist'`
- ✅ **Agent metadata** - responses include agent name and task
- ⚠️ **Markdown format** - less structured than baseline tiles
- ⚠️ **Dynamic generation** - tiles created from agent responses

**Example - KRAS G12C:**
```typescript
{
  type: 'agent_response',
  timestamp: 2000,
  data: {
    agent: 'Target Biology Specialist', // ✅ Agent attribution
    response: `## KRAS G12C: Comprehensive Target Biology...`
  }
}
```

### Comparison: TROP2 vs Demo Data

| Aspect | TROP2 Baseline | Demo Scenario |
|--------|---------------|---------------|
| **Data Structure** | ⭐⭐⭐⭐⭐ Structured TypeScript | ⭐⭐⭐ Markdown strings |
| **Visual Components** | ⭐⭐⭐⭐⭐ Specialized tiles with charts | ⭐⭐⭐ Generic markdown renderer |
| **Agent Attribution** | ❌ None | ✅ Present |
| **Interactivity** | ⭐⭐⭐⭐⭐ Charts, filters, tabs | ⭐⭐ Limited |
| **Data Completeness** | ⭐⭐⭐⭐⭐ 15+ tissues, 10+ tumors | ⭐⭐⭐ Text-based |

**Key Finding:** TROP2 has superior data structure and visualizations, but lacks agent attribution that demo scenarios have.

---

## 🎨 Proposed Agent Attribution System

### Visual Design: Agent Bubbles

**Placement:** Top-right of tile header (to the right of title, inline with header)

**Design:**
```
┌─────────────────────────────────────────────────────────┐
│  Executive Summary                    [🤖 Sonny] [🧬 TB] │
│  ───────────────────────────────────────────────────────│
│                                                          │
│  [Tile Content]                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Agent Bubble Components:**
- **Icon:** Agent-specific emoji/icon (🤖 Sonny, 🧬 Target Biology, 🏥 Clinical, etc.)
- **Tooltip:** Agent name on hover
- **Clickable:** Opens agent panel with tile context
- **Color-coded:** Agent-specific color theme
- **Compact:** Small, non-intrusive design

### Agent Mapping: Scientist Dashboard

**User's Proposed Mapping:**

| Tile | Primary Agent(s) | Rationale |
|------|-----------------|-----------|
| **Executive Summary** | 🤖 **Sonny** | Synthesis of all agents' work |
| **Expression Biology** | 🧬 **Target Biology** + 🏥 **Clinical** | Expression data (TB) + clinical context (Clinical) |
| **Mechanistic Rationale** | 🧬 **Target Biology** | Pathway biology, mechanism of action |
| **Genetic Validation** | 🧬 **Target Biology** | Genetic evidence, GWAS, constraint metrics |
| **Druggability** | 🧬 **Target Biology** | Structural data, modality recommendations |
| **Clinical Precedent** | 🏥 **Clinical** | Clinical trials, efficacy data |
| **Safety Assessment** | 🏥 **Clinical** | Safety data, toxicity profiles |
| **Key Experiments** | 🤖 **Sonny** (or 🧬 **Target Biology** + 🏥 **Clinical**) | Strategic recommendations, evidence gaps |

**Alternative for Key Experiments:**
- Option A: **Sonny** (strategic synthesis)
- Option B: **Target Biology + Clinical** (evidence gaps from both domains)

**Recommendation:** **Sonny** for Key Experiments (strategic synthesis fits Sonny's role as orchestrator)

### Agent Mapping: Scout/BD Dashboard

**User's Proposed Mapping:**

| Tile | Primary Agent(s) | Rationale |
|------|-----------------|-----------|
| **Executive Summary** | 🤖 **Sonny** | BD opportunity synthesis |
| **Scientific Validation** | 🧬 **Target Biology** + 🏥 **Clinical** | Scientific foundation |
| **Competitive Landscape** | 📊 **Market Research** | Competitive analysis |
| **Clinical Positioning** | 🏥 **Clinical** | Clinical differentiation |
| **IP & FTO** | 📜 **Patent** | Patent landscape |
| **Market Opportunity** | 💰 **Financial** + 📊 **Market Research** | Market sizing |
| **Deal Landscape** | 💰 **Financial** | Comparable deals |
| **Strategic Recommendation** | 🤖 **Sonny** | Strategic synthesis |

**Persona-Based Distribution:**
- **Scientist View:** Heavy on Target Biology + Clinical (scientific focus)
- **Scout View:** Heavy on Financial + Market Research + Regulatory (commercial focus)

---

## 🔍 Data Comparison: TROP2 vs Demo Scenarios

### Executive Summary Comparison

**TROP2 Baseline:**
```typescript
{
  overallScore: 82,
  recommendation: 'Advance',
  confidenceLevel: 0.85,
  summaryText: "TROP2 (TACSTD2) represents a well-validated oncology target...",
  keyStrengths: [
    'FDA-approved ADC (Trodelvy) validates mechanism',
    'High differential expression in TNBC (8.2x fold-change)',
    // ... 3 more
  ],
  keyRisks: [
    'On-target toxicity in skin/mucosa (high normal expression)',
    // ... 4 more
  ],
  weightedScoring: {
    genetic: { score: 65, weight: 0.2 },
    expression: { score: 88, weight: 0.25 },
    // ... more
  }
}
```

**Demo Scenario (KRAS G12C):**
```markdown
## Executive Summary

**KRAS G12C** represents a validated oncogenic target with strong genetic evidence...

**Overall Target Validation Score: STRONG** (Grade: A)
**Translational Confidence: HIGH**
**Recommendation: VALIDATED TARGET - Proceed with development**

### Strengths
1. ✓ Strong genetic validation - Gold standard driver mutation evidence
2. ✓ Proven druggability - Two FDA-approved drugs validate approach
// ... more
```

**Key Differences:**
- ✅ TROP2: **Structured scoring** (numeric scores, weighted metrics)
- ✅ TROP2: **Quantitative metrics** (scores, percentages)
- ⚠️ Demo: **Qualitative assessments** (text-based grades)
- ✅ TROP2: **Better for visualization** (scores can be charted)

**Enhancement Opportunity:** Add agent attribution to TROP2 while maintaining superior structure.

### Expression Biology Comparison

**TROP2 Baseline:**
```typescript
{
  therapeuticWindowScore: 'Favorable',
  bestIndication: { name: 'Triple-Negative Breast Cancer', foldChange: 8.2, rank: 1 },
  gtexNormalTissues: [
    { name: 'Skin', tpm: 245, isSafetyOrgan: true, category: 'skin' },
    { name: 'Esophagus Mucosa', tpm: 198, isSafetyOrgan: true, category: 'gi' },
    // ... 15+ tissues
  ],
  tcgaTumorExpression: [
    { tumorType: 'TNBC', tcgaCode: 'BRCA', medianTPM: 892, percentileRank: 95, sampleCount: 187 },
    // ... 10+ tumor types
  ],
  foldChangeData: [
    { indication: 'TNBC', tumorTPM: 892, normalTPM: 42, foldChange: 21.2 },
    // ... multiple indications
  ]
}
```

**Demo Scenario (KRAS G12C):**
```markdown
## 4. Expression Analysis

### 4.1 Tissue Profile

| Tissue | Expression Level (TPM) | Relevance | Citation |
|--------|----------------------|-----------|----------|
| **Lung** | 45.2 (median) | High - primary indication | GTEx v8 [21] |
| **Colon** | 38.7 (median) | High - secondary indication | GTEx v8 [21] |
// ... 5 tissues
```

**Key Differences:**
- ✅ TROP2: **15+ tissues** with structured data (arrays for charts)
- ⚠️ Demo: **5 tissues** in markdown table (harder to visualize)
- ✅ TROP2: **Chart-ready data** (foldChangeData array)
- ⚠️ Demo: **Text tables** (requires parsing)

**Enhancement Opportunity:** TROP2 data is superior - just needs agent attribution.

---

## 📐 Implementation Plan

### Phase 1: Add Agent Metadata to Data Constants

**Goal:** Add agent attribution to TROP2 data constants without breaking existing structure.

**Approach:**
```typescript
export const SCIENTIST_EXECUTIVE_SUMMARY = {
  // Existing data fields
  overallScore: 82,
  recommendation: 'Advance',
  // ... all existing fields
  
  // NEW: Agent attribution metadata
  agents: ['sonny'], // Array of agent types
  primaryAgent: 'sonny', // Primary agent for display
  agentContributions: {
    sonny: 'Synthesized analysis from all agents',
    target_biology: 'Provided genetic validation and expression data',
    clinical: 'Provided clinical precedent and safety data',
  },
};
```

**For Multi-Agent Tiles:**
```typescript
export const EXPRESSION_DATA = {
  // Existing data fields
  therapeuticWindowScore: 'Favorable',
  // ... all existing fields
  
  // NEW: Multi-agent attribution
  agents: ['target_biology', 'clinical'],
  primaryAgent: 'target_biology', // Primary for icon display
  agentContributions: {
    target_biology: 'Provided GTEx/TCGA expression data and fold-change analysis',
    clinical: 'Provided clinical context for expression patterns',
  },
};
```

### Phase 2: Create Agent Badge Component

**Component:** `AgentBadge.tsx`

**Props:**
```typescript
interface AgentBadgeProps {
  agent: AgentType | 'sonny';
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  onClick?: () => void;
  className?: string;
}
```

**Design:**
- Small circular/rounded badge with agent icon
- Color-coded by agent type
- Hover tooltip with agent name
- Clickable to open agent panel

**Visual:**
```
[🤖]  // Sonny badge
[🧬]  // Target Biology badge
[🏥]  // Clinical badge
```

### Phase 3: Update Tile Component

**Modification:** Add `agents` prop to `Tile` component

**Current:**
```typescript
interface TileProps {
  title: string;
  // ... existing props
  headerRight?: React.ReactNode;
}
```

**Updated:**
```typescript
interface TileProps {
  title: string;
  // ... existing props
  headerRight?: React.ReactNode;
  agents?: (AgentType | 'sonny')[]; // NEW
  primaryAgent?: AgentType | 'sonny'; // NEW
}
```

**Rendering:**
```tsx
<Tile
  title="Executive Summary"
  agents={['sonny']}
  primaryAgent="sonny"
  headerRight={
    <div className="flex items-center gap-2">
      {/* Agent badges */}
      {agents?.map(agent => (
        <AgentBadge key={agent} agent={agent} size="sm" />
      ))}
      {/* Existing headerRight content */}
    </div>
  }
>
  {/* Tile content */}
</Tile>
```

### Phase 4: Update Tile Components

**Modification:** Pass agent metadata from data constants to Tile component

**Example - ExecutiveSummaryTile:**
```tsx
export default function ExecutiveSummaryTile({ data }: ExecutiveSummaryTileProps) {
  return (
    <Tile
      title="Executive Summary"
      agents={data.agents || ['sonny']} // Extract from data
      primaryAgent={data.primaryAgent || 'sonny'}
      // ... rest of props
    >
      {/* Content */}
    </Tile>
  );
}
```

**Example - ExpressionBiologyTile:**
```tsx
export default function ExpressionBiologyTile({ data }: ExpressionBiologyTileProps) {
  return (
    <Tile
      title="Expression Biology"
      agents={data.agents || ['target_biology', 'clinical']}
      primaryAgent={data.primaryAgent || 'target_biology'}
      // ... rest of props
    >
      {/* Content */}
    </Tile>
  );
}
```

### Phase 5: Add Click Handler

**Goal:** Clicking agent badge opens agent panel with tile context

**Implementation:**
```tsx
const handleAgentClick = (agent: AgentType | 'sonny') => {
  window.dispatchEvent(new CustomEvent('open-agent-panel', {
    detail: {
      agent,
      tileId: 'executive-summary', // Or tile ID
      context: {
        target: 'TROP2',
        data: data, // Tile data
        tileTitle: 'Executive Summary',
      },
    },
  }));
};

<AgentBadge 
  agent={agent} 
  onClick={() => handleAgentClick(agent)}
/>
```

---

## 🎯 Agent Mapping: Final Recommendations

### Scientist Dashboard Tiles

| Tile | Agents | Primary | Rationale |
|------|--------|---------|-----------|
| **Executive Summary** | Sonny | Sonny | Strategic synthesis |
| **Expression Biology** | Target Biology, Clinical | Target Biology | Expression data (TB) + clinical context |
| **Mechanistic Rationale** | Target Biology | Target Biology | Pathway biology, MOA |
| **Genetic Validation** | Target Biology | Target Biology | Genetic evidence |
| **Druggability** | Target Biology | Target Biology | Structural data, modalities |
| **Clinical Precedent** | Clinical | Clinical | Clinical trials, efficacy |
| **Safety Assessment** | Clinical | Clinical | Safety data, toxicity |
| **Key Experiments** | Sonny | Sonny | Strategic recommendations |

### Scout/BD Dashboard Tiles

| Tile | Agents | Primary | Rationale |
|------|--------|---------|-----------|
| **Executive Summary** | Sonny | Sonny | BD opportunity synthesis |
| **Scientific Validation** | Target Biology, Clinical | Target Biology | Scientific foundation |
| **Competitive Landscape** | Market Research | Market Research | Competitive analysis |
| **Clinical Positioning** | Clinical | Clinical | Clinical differentiation |
| **IP & FTO** | Patent | Patent | Patent landscape |
| **Market Opportunity** | Financial, Market Research | Financial | Market sizing |
| **Deal Landscape** | Financial | Financial | Comparable deals |
| **Strategic Recommendation** | Sonny | Sonny | Strategic synthesis |

---

## 📊 Data Enhancement Opportunities

### 1. Add Agent Metadata to Constants

**Current:**
```typescript
export const SCIENTIST_EXECUTIVE_SUMMARY = {
  overallScore: 82,
  // ... data
};
```

**Enhanced:**
```typescript
export const SCIENTIST_EXECUTIVE_SUMMARY = {
  overallScore: 82,
  // ... existing data
  
  // Agent attribution
  agents: ['sonny'],
  primaryAgent: 'sonny',
  agentContributions: {
    sonny: 'Synthesized comprehensive analysis from Target Biology, Clinical, Patent, Financial, Regulatory, and Market Research agents',
  },
};
```

### 2. Enhance Graphics in Tiles

**Current State:**
- ✅ Expression Biology: Charts (bar, scatter)
- ✅ Clinical Precedent: Trial cards
- ⚠️ Executive Summary: Text only
- ⚠️ Genetic Validation: Text + metrics
- ⚠️ Druggability: Text + lists

**Enhancement Opportunities:**

**Executive Summary:**
- Add **weighted scoring visualization** (radar chart or stacked bar)
- Add **quick metrics cards** with icons
- Add **strength/risk comparison chart**

**Genetic Validation:**
- Add **GWAS association chart** (bar chart by score)
- Add **constraint metrics visualization** (pLI, LOEUF)
- Add **biobank evidence timeline**

**Druggability:**
- Add **modality feasibility chart** (bar chart)
- Add **structural data visualization** (PDB structure viewer link)
- Add **existing compounds timeline**

**Mechanistic Rationale:**
- Add **pathway diagram** (interactive)
- Add **publication trend chart** (line chart)
- Add **key researchers network**

**Safety Assessment:**
- Add **expression concerns heatmap** (organ vs concern)
- Add **therapeutic index visualization**
- Add **class safety comparison chart**

**Key Experiments:**
- Add **evidence gaps prioritization chart**
- Add **experiment timeline** (Gantt-style)
- Add **resource estimate breakdown**

### 3. Compare with Demo Data Quality

**TROP2 Strengths:**
- ✅ Structured arrays for charts
- ✅ Quantitative metrics
- ✅ Rich nested data
- ✅ Chart-ready format

**Demo Data Strengths:**
- ✅ Agent attribution
- ✅ Narrative flow
- ✅ Citations embedded
- ✅ Real-time generation

**Best of Both:**
- Combine TROP2 structure with demo agent attribution
- Add agent metadata to TROP2 constants
- Maintain TROP2's superior data structure
- Add agent badges to tiles

---

## 🎨 Visual Design Specifications

### Agent Badge Design

**Size:** Small (24px × 24px)

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Executive Summary    [🤖] [🧬] [🏥]        │
│  ───────────────────────────────────────────│
```

**Badge States:**
- **Default:** Icon only, subtle background
- **Hover:** Show agent name tooltip, slight scale-up
- **Active:** Highlighted border, agent panel open

**Colors (by agent):**
- **Sonny:** Primary color (purple/blue gradient)
- **Target Biology:** Emerald/teal
- **Clinical:** Blue
- **Patent:** Purple
- **Financial:** Green
- **Regulatory:** Orange
- **Market Research:** Teal

### Multi-Agent Display

**When 2+ agents:**
- Show primary agent badge prominently
- Show secondary agents as smaller badges
- On hover, show all contributing agents

**Example:**
```
Expression Biology    [🧬] [🏥]  // Primary: Target Biology, Secondary: Clinical
```

---

## 🔄 Integration with Existing System

### Tile Component Integration

**Current Tile Props:**
```typescript
interface TileProps {
  title: string;
  headerRight?: React.ReactNode;
  // ... other props
}
```

**Enhanced Tile Props:**
```typescript
interface TileProps {
  title: string;
  headerRight?: React.ReactNode;
  agents?: (AgentType | 'sonny')[]; // NEW
  primaryAgent?: AgentType | 'sonny'; // NEW
  onAgentClick?: (agent: AgentType | 'sonny') => void; // NEW
  // ... other props
}
```

**Tile Header Rendering:**
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    {icon}
    <div>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  </div>
  
  <div className="flex items-center gap-2">
    {/* Agent badges */}
    {agents && agents.map(agent => (
      <AgentBadge 
        key={agent}
        agent={agent}
        size="sm"
        onClick={() => onAgentClick?.(agent)}
      />
    ))}
    
    {/* Existing headerRight */}
    {headerRight}
  </div>
</div>
```

### Data Constant Updates

**Pattern for all constants:**
```typescript
export const TILE_NAME_DATA = {
  // All existing data fields
  // ... (no changes to existing structure)
  
  // NEW: Agent attribution (optional, defaults provided)
  agents?: (AgentType | 'sonny')[];
  primaryAgent?: AgentType | 'sonny';
  agentContributions?: Record<string, string>;
};
```

**Backward Compatibility:**
- Agent fields are **optional**
- Defaults provided in tile components
- Existing tiles work without changes
- Gradual migration possible

---

## 📋 Implementation Checklist

### Phase 1: Agent Metadata
- [ ] Add `agents` field to all TROP2 data constants
- [ ] Add `primaryAgent` field to all constants
- [ ] Add `agentContributions` descriptions
- [ ] Ensure backward compatibility

### Phase 2: Agent Badge Component
- [ ] Create `AgentBadge.tsx` component
- [ ] Add agent icons/colors mapping
- [ ] Implement hover tooltips
- [ ] Add click handlers

### Phase 3: Tile Component Updates
- [ ] Add `agents` prop to `Tile` component
- [ ] Add `primaryAgent` prop
- [ ] Add `onAgentClick` handler
- [ ] Update header rendering

### Phase 4: Tile Component Integration
- [ ] Update `ExecutiveSummaryTile` to pass agents
- [ ] Update `ExpressionBiologyTile` to pass agents
- [ ] Update all other tile components
- [ ] Test agent badge display

### Phase 5: Click Handlers
- [ ] Implement agent panel opening
- [ ] Add context pre-population
- [ ] Test click interactions
- [ ] Verify agent panel integration

### Phase 6: Graphics Enhancements (Optional)
- [ ] Add weighted scoring chart to Executive Summary
- [ ] Add GWAS chart to Genetic Validation
- [ ] Add modality chart to Druggability
- [ ] Add pathway diagram to Mechanistic
- [ ] Add safety heatmap to Safety Assessment
- [ ] Add experiment timeline to Key Experiments

---

## 🎯 Success Criteria

1. **Agent Attribution:**
   - ✅ All TROP2 tiles show agent badges
   - ✅ Badges are visually clear and non-intrusive
   - ✅ Clicking badges opens agent panel
   - ✅ Context is pre-populated from tile

2. **Data Quality:**
   - ✅ TROP2 data structure maintained
   - ✅ Agent metadata doesn't break existing tiles
   - ✅ Backward compatibility preserved

3. **User Experience:**
   - ✅ Clear visual connection between tiles and agents
   - ✅ Easy to understand which agents contributed
   - ✅ Seamless navigation to agent panels
   - ✅ Enhanced understanding of multi-agent system

4. **Graphics Enhancements:**
   - ✅ Charts added where appropriate
   - ✅ Visualizations enhance understanding
   - ✅ Graphics match tile content
   - ✅ Performance maintained

---

## 📝 Next Steps

1. **Review this planning document**
2. **Approve agent mapping** (confirm tile-to-agent assignments)
3. **Approve visual design** (agent badge style)
4. **Prioritize enhancements** (which graphics to add first)
5. **Begin Phase 1** (add agent metadata to constants)

---

## 🔗 Key Files Reference

### TROP2 Data Constants
- **Location:** `src/constants/index.ts`
- **Tiles:** 14 constants (7 Scientist + 7 Scout)

### Tile Components
- **Location:** `src/components/tiles/*.tsx`
- **Base Component:** `src/components/Tile.tsx`

### Agent Info
- **Location:** `src/lib/customAgentTeams.ts` (check for AGENT_INFO)
- **Types:** `src/lib/multiAgentTypes.ts`

### Demo Scenarios
- **Location:** `src/lib/demoMultiAgentScenarios.ts`
- **Examples:** DEMO_KRAS_G12C, DEMO_HER2_ANALYSIS

---

**End of Planning Document**

