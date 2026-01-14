# LUMINA Agent Hero Skills Redesign - Implementation Plan

## 📋 Executive Summary

This plan outlines the systematic implementation of the Hero Skills redesign for all 6 specialized agents and Sonny (Chief Orchestrator). The redesign transforms complex, tabbed interfaces into clean, focused experiences with 2 prominent Hero Skills per agent.

**Key Principles:**
- Maintain existing design system (Tailwind, Framer Motion, dark theme)
- Preserve current functionality while simplifying UI
- Gradual migration path (shared components → individual agents → Sonny)
- Backward compatibility during transition
- Consistent UX patterns across all agents

---

## 🏗️ Current Architecture Analysis

### Existing Structure

```
src/components/
├── SonnySidePanel.tsx          # Main panel container (right side)
├── clinical/
│   └── ClinicalAgentInterface.tsx  # Tabbed interface (analyze/trials/competitive/diligence)
├── patent/
│   └── PatentAgentInterface.tsx    # Upload/analysis/results interface
├── financial/
│   └── FinancialAgentInterface.tsx # Tabbed interface (analyze/models/deals/monitor)
├── market/
│   └── MarketResearchAgentInterface.tsx
├── regulatory/
│   └── RegulatoryAgentInterface.tsx
├── target-biology/
│   └── TargetBiologyAgentInterface.tsx
└── shared/                     # Existing shared components
    ├── CollapsibleSection.tsx
    ├── FileUpload.tsx
    └── ExportButton.tsx
```

### Current Integration Points

1. **SonnySidePanel.tsx** (lines 112-2362)
   - Manages agent selection via `selectedAgent` state
   - Conditionally renders agent interfaces based on selection
   - Handles panel collapse/expand, width resizing
   - Integrates with workspace and tile stores

2. **Agent Interfaces**
   - Each has its own tabbed/complex interface
   - Some have document upload (Patent, Financial)
   - Some have export functionality
   - All have chat input at bottom

3. **Design System**
   - Dark theme (`bg-gray-900`, `text-white`, `border-white/10`)
   - Agent-specific colors via `AGENT_COLORS` mapping
   - Framer Motion for animations
   - Tailwind CSS for styling

---

## 🎯 Implementation Phases

### Phase 1: Shared Components Foundation (Priority: CRITICAL)

**Goal:** Create reusable components that all agents will use.

**Files to Create:**

1. **`src/components/agents/shared/HeroSkillCard.tsx`**
   - Prominent, clickable card component
   - Theme color support (blue, purple, green, cyan, orange, emerald)
   - Loading states, badges, hover effects
   - Framer Motion animations

2. **`src/components/agents/shared/DocumentUploadZone.tsx`**
   - Universal drag-and-drop upload
   - File validation and preview
   - Theme color integration
   - Compact/full modes

3. **`src/components/agents/shared/ExportDropdown.tsx`**
   - Dropdown with multiple export formats
   - Theme color support
   - Loading states
   - Format: PDF, PPTX, DOCX, XLSX, Share Link, Email

4. **`src/components/agents/shared/FutureAnalysisDropdown.tsx`**
   - Collapsible dropdown for additional options
   - "Coming Soon" badges
   - Theme color integration
   - Expand/collapse animations

5. **`src/components/agents/shared/AgentInterfaceLayout.tsx`**
   - Base layout wrapper for all agent interfaces
   - Consistent header with agent icon, name, target
   - Export dropdown in header
   - Chat section at bottom
   - Theme color gradients

6. **`src/components/agents/shared/index.ts`**
   - Barrel export for all shared components

**Dependencies:**
- Existing: `lucide-react`, `framer-motion`, Tailwind config
- No new dependencies required

**Design Consistency:**
- Use existing color palette from `AGENT_COLORS`
- Match current dark theme styling
- Follow existing animation patterns (Framer Motion)
- Maintain spacing/sizing conventions

---

### Phase 2: Individual Agent Interfaces (Priority: HIGH)

**Goal:** Redesign each agent interface to use Hero Skills pattern.

**Approach:** Create new streamlined interfaces alongside existing ones, then migrate.

#### 2.1 Clinical Agent

**File:** `src/components/clinical/ClinicalAgentInterfaceV2.tsx` (new)

**Hero Skills:**
1. **Trial Landscape Analyzer** (Map icon, blue theme)
   - Triggers comprehensive clinical trial search
   - Shows competitive positioning
   - AI-powered badge

2. **Clinical Validation Score** (Shield icon, blue theme)
   - Generates validation scorecard
   - Efficacy signals, safety profile, development risk
   - Real-time badge

**Future Analysis Options:**
- Competitive Trial Intelligence
- Endpoint Analysis
- Patient Population Modeling (Coming Soon)
- Safety Signal Detection (Coming Soon)
- Trial Design Optimizer (Coming Soon)
- Regulatory Strategy Alignment (Coming Soon)

**Integration:**
- Replace `ClinicalAgentInterface` import in `SonnySidePanel.tsx`
- Preserve existing analysis logic where possible
- Maintain chat functionality

#### 2.2 Patent Agent

**File:** `src/components/patent/PatentAgentInterfaceV2.tsx` (new)

**Hero Skills:**
1. **FTO Risk Assessment** (AlertTriangle icon, purple theme)
   - Comprehensive FTO analysis
   - Risk scoring, blocking patents
   - AI-powered badge

2. **Patent Landscape Map** (Map icon, purple theme)
   - Visual patent landscape
   - Key players, white spaces
   - Interactive badge

**Future Analysis Options:**
- Claims Extraction & Analysis
- Sequence Patent Search
- Prior Art Search
- Invalidity Contention Analysis (Coming Soon)
- Licensing Opportunity Finder (Coming Soon)
- White Space Analysis (Coming Soon)
- Patent Family Tree (Coming Soon)

**Integration:**
- Replace `PatentAgentInterface` import
- Preserve patent parsing logic
- Maintain document upload functionality

#### 2.3 Financial Agent

**File:** `src/components/financial/FinancialAgentInterfaceV2.tsx` (new)

**Hero Skills:**
1. **Deal Comparables Analysis** (TrendingUp icon, green theme)
   - Comparable M&A transactions
   - Licensing deals, valuations
   - AI-powered badge

2. **Revenue Forecast Model** (LineChart icon, green theme)
   - Probability-weighted projections
   - Market sizing, pricing analysis
   - Interactive badge

**Future Analysis Options:**
- DCF Valuation Model
- Market Sizing Analysis
- Pricing & Reimbursement
- Investor Analysis (Coming Soon)
- M&A Scenario Modeling (Coming Soon)
- Financial Risk Metrics (Coming Soon)

#### 2.4 Market Research Agent

**File:** `src/components/market/MarketResearchAgentInterfaceV2.tsx` (new)

**Hero Skills:**
1. **Market Sizing Analysis** (PieChart icon, cyan theme)
   - TAM/SAM/SOM analysis
   - Growth projections, segment breakdowns
   - AI-powered badge

2. **Competitive Positioning Matrix** (Grid3X3 icon, cyan theme)
   - Visual competitive landscape
   - Product positioning, differentiation
   - Interactive badge

**Future Analysis Options:**
- KOL Mapping & Influence
- Pipeline Tracker
- Geographic Market Analysis
- Unmet Needs Assessment (Coming Soon)
- Launch Analog Analysis (Coming Soon)
- Conference Intelligence (Coming Soon)

#### 2.5 Regulatory Agent

**File:** `src/components/regulatory/RegulatoryAgentInterfaceV2.tsx` (new)

**Hero Skills:**
1. **Approval Pathway Advisor** (Route icon, orange theme)
   - Regulatory pathway recommendation
   - Timeline estimates, required studies
   - AI-powered badge

2. **Expedited Designation Eligibility** (Zap icon, orange theme)
   - Fast Track, Breakthrough, Priority Review assessment
   - Accelerated Approval, RMAT eligibility
   - Assessment badge

**Future Analysis Options:**
- FDA Precedent Analysis
- Regulatory Timeline Modeling
- Global Filing Strategy
- Regulatory Risk Assessment (Coming Soon)
- Label Strategy Advisor (Coming Soon)
- Advisory Committee Prep (Coming Soon)

#### 2.6 Target Biology Agent

**File:** `src/components/target-biology/TargetBiologyAgentInterfaceV2.tsx` (new)

**Hero Skills:**
1. **Expression Profile Analysis** (Activity icon, emerald theme)
   - Gene/protein expression analysis
   - Tissues, disease states, cell types
   - AI-powered badge

2. **Genetic Validation Score** (CheckCircle icon, emerald theme)
   - Target validation score
   - Genetic associations, LOF studies
   - Real-time badge

**Future Analysis Options:**
- Pathway & Network Analysis
- Structural Analysis
- Literature Deep Dive
- Biomarker Identification (Coming Soon)
- Assay Design Recommendations (Coming Soon)
- Safety Liability Assessment (Coming Soon)

---

### Phase 3: Sonny (Chief Orchestrator) Interface (Priority: HIGH)

**Goal:** Redesign Sonny's interface with 2 Hero Skills emphasizing orchestration power.

**File:** `src/components/sonny/SonnyHeroInterface.tsx` (new)

**Hero Skills:**
1. **Executive Target Brief** (FileText icon, gradient theme)
   - Synthesizes all 6 agents
   - 1-page executive summary
   - "6-Agent Synthesis" badge

2. **Investment Thesis Generator** (TrendingUp icon, gradient theme)
   - AI-powered investment thesis
   - Bull/bear cases, valuation framework
   - "AI-Powered" badge

**Special Features:**
- **Gradient Theme:** Purple → Blue → Cyan (represents multi-agent coordination)
- **Agent Progress Visualization:** Shows real-time status of each agent during synthesis
- **Results Display:**
  - Executive Brief: Overview, Key Findings, Risk Summary, Opportunity Score, Recommendations
  - Investment Thesis: Thesis, Bull/Bear Cases, Valuation Range, Comparable Deals, Risks

**Future Analysis Options:**
- Custom Multi-Agent Query
- Fast Mode Analysis
- Thorough Mode Analysis
- Route to Specific Agent
- Team Collaboration Report (Coming Soon)
- Automated Monitoring (Coming Soon)
- Analysis History (Coming Soon)
- External Data Integration (Coming Soon)

**Integration:**
- Update `SonnySidePanel.tsx` to render `SonnyHeroInterface` when `selectedAgent === 'sonny'`
- Preserve existing orchestration logic
- Maintain demo/live mode toggle

---

### Phase 4: Integration & Migration (Priority: MEDIUM)

**Goal:** Integrate new interfaces into `SonnySidePanel.tsx` and ensure smooth transition.

#### 4.1 Update SonnySidePanel.tsx

**Changes Required:**

1. **Import new interfaces:**
```typescript
// Replace existing imports
import ClinicalAgentInterfaceV2 from './clinical/ClinicalAgentInterfaceV2';
import PatentAgentInterfaceV2 from './patent/PatentAgentInterfaceV2';
// ... etc for all agents
import SonnyHeroInterface from './sonny/SonnyHeroInterface';
```

2. **Update agent rendering logic:**
```typescript
// In the render section, replace conditional rendering:
{selectedAgent === 'clinical' && (
  <ClinicalAgentInterfaceV2
    targetName={targetName}
    onClose={onClose}
  />
)}
// ... etc for all agents

{selectedAgent === 'sonny' && (
  <SonnyHeroInterface
    targetName={targetName}
    onClose={onClose}
    isDemo={isDemo}
  />
)}
```

3. **Preserve existing functionality:**
- Panel collapse/expand
- Width resizing
- Agent selection dropdown
- Workspace integration
- Tile creation from agent responses

#### 4.2 Backward Compatibility

**Strategy:**
- Keep old interfaces in codebase initially (rename to `*V1.tsx`)
- Use feature flag or environment variable to toggle between old/new
- Gradual migration allows for testing and rollback

**Implementation:**
```typescript
// In SonnySidePanel.tsx
const USE_HERO_SKILLS = true; // Feature flag

{selectedAgent === 'clinical' && (
  USE_HERO_SKILLS ? (
    <ClinicalAgentInterfaceV2 ... />
  ) : (
    <ClinicalAgentInterface ... />
  )
)}
```

---

### Phase 5: Type Definitions & Configuration (Priority: LOW)

**Goal:** Add TypeScript types and configuration for maintainability.

**File:** `src/types/agents.ts` (new or extend existing)

```typescript
export interface HeroSkill {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  onClick: () => void;
}

export interface AgentConfig {
  name: string;
  themeColor: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  heroSkills: HeroSkill[];
  futureAnalysisOptions: AnalysisOption[];
}

export interface AnalysisOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  onClick?: () => void;
}
```

**File:** `src/lib/agentConfig.ts` (new or extend existing)

```typescript
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  clinical: {
    name: 'Clinical Development Agent',
    themeColor: 'blue',
    heroSkills: [...],
    futureAnalysisOptions: [...],
  },
  // ... etc
};
```

---

## 🎨 Design Consistency Guidelines

### Color System

**Use existing `AGENT_COLORS` mapping:**
```typescript
const AGENT_COLORS: Record<AgentType | 'sonny', string> = {
  sonny: 'primary',        // Gradient (purple → blue → cyan)
  clinical: 'blue',       // #0A84FF
  patent: 'purple',       // #BF5AF2
  financial: 'green',     // #30D158
  regulatory: 'orange',   // #FF9F0A
  market_research: 'teal', // #5AC8FA (use 'cyan' in Tailwind)
  target_biology: 'emerald', // #34D399
};
```

**Tailwind Color Classes:**
- `blue-500`, `blue-400`, `blue-300` for clinical
- `purple-500`, `purple-400`, `purple-300` for patent
- `green-500`, `green-400`, `green-300` for financial
- `cyan-500`, `cyan-400`, `cyan-300` for market research
- `orange-500`, `orange-400`, `orange-300` for regulatory
- `emerald-500`, `emerald-400`, `emerald-300` for target biology

### Spacing & Sizing

**Follow existing patterns:**
- Section padding: `px-6 py-4` or `px-6 py-6`
- Card padding: `p-5` for hero skills
- Gap spacing: `gap-4` for grid layouts
- Border radius: `rounded-xl` for cards, `rounded-lg` for buttons

### Typography

**Use existing text classes:**
- Headers: `text-lg font-semibold text-white`
- Descriptions: `text-sm text-gray-400`
- Labels: `text-sm font-medium text-gray-300`
- Uppercase labels: `text-sm font-medium text-gray-400 uppercase tracking-wider`

### Animations

**Framer Motion patterns:**
- Hover: `whileHover={{ scale: 1.02, y: -2 }}`
- Tap: `whileTap={{ scale: 0.98 }}`
- Fade in: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`
- Slide: `initial={{ x: -20 }} animate={{ x: 0 }}`

---

## 🔧 Technical Implementation Details

### Component Structure

**HeroSkillCard:**
```typescript
interface HeroSkillCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  themeColor: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  onClick: () => void;
  isLoading?: boolean;
  badge?: string;
}
```

**AgentInterfaceLayout:**
```typescript
interface AgentInterfaceLayoutProps {
  agentName: string;
  agentIcon: LucideIcon;
  themeColor: string;
  targetName?: string;
  onClose?: () => void;
  onExport: (format: string) => void;
  children: React.ReactNode;
  chatSection?: React.ReactNode;
}
```

### State Management

**No new stores required.** Use existing:
- `useTileStore` for tiles
- `useWorkspaceStore` for workspaces
- Local component state for UI (loading, dropdowns, etc.)

### API Integration

**Preserve existing API calls:**
- Agent interfaces should call existing endpoints
- Hero Skills trigger same analysis workflows
- Results displayed in same format (tiles, panels, etc.)

---

## 📝 File Structure After Implementation

```
src/components/
├── agents/
│   └── shared/
│       ├── index.ts
│       ├── HeroSkillCard.tsx
│       ├── DocumentUploadZone.tsx
│       ├── ExportDropdown.tsx
│       ├── FutureAnalysisDropdown.tsx
│       └── AgentInterfaceLayout.tsx
├── clinical/
│   ├── ClinicalAgentInterface.tsx      # Old (keep for rollback)
│   └── ClinicalAgentInterfaceV2.tsx   # New Hero Skills version
├── patent/
│   ├── PatentAgentInterface.tsx
│   └── PatentAgentInterfaceV2.tsx
├── financial/
│   ├── FinancialAgentInterface.tsx
│   └── FinancialAgentInterfaceV2.tsx
├── market/
│   ├── MarketResearchAgentInterface.tsx
│   └── MarketResearchAgentInterfaceV2.tsx
├── regulatory/
│   ├── RegulatoryAgentInterface.tsx
│   └── RegulatoryAgentInterfaceV2.tsx
├── target-biology/
│   ├── TargetBiologyAgentInterface.tsx
│   └── TargetBiologyAgentInterfaceV2.tsx
├── sonny/
│   ├── SonnyHeroInterface.tsx          # New
│   └── index.ts
└── SonnySidePanel.tsx                  # Updated to use new interfaces
```

---

## ✅ Testing Checklist

### Phase 1: Shared Components
- [ ] HeroSkillCard renders with all theme colors
- [ ] DocumentUploadZone handles drag-and-drop
- [ ] ExportDropdown shows all format options
- [ ] FutureAnalysisDropdown expands/collapses
- [ ] AgentInterfaceLayout provides consistent header
- [ ] All components work with each theme color
- [ ] Framer Motion animations are smooth
- [ ] Responsive behavior on different screen sizes

### Phase 2: Individual Agents
- [ ] Clinical: Hero Skills trigger analysis
- [ ] Patent: FTO and Landscape work
- [ ] Financial: Deal Comps and Revenue Model work
- [ ] Market: Market Sizing and Competitive Matrix work
- [ ] Regulatory: Pathway and Designation work
- [ ] Target Biology: Expression and Validation work
- [ ] All agents: Document upload works
- [ ] All agents: Export dropdown works
- [ ] All agents: Future Analysis dropdown works
- [ ] All agents: Chat input is functional
- [ ] All agents: Theme colors are consistent

### Phase 3: Sonny Interface
- [ ] Executive Target Brief triggers 6-agent synthesis
- [ ] Investment Thesis shows bull/bear cases
- [ ] Gradient theme (purple → blue → cyan) is consistent
- [ ] Agent status grid shows real-time progress
- [ ] Export dropdown works with all formats
- [ ] Document upload accepts files
- [ ] Future Analysis dropdown expands/collapses
- [ ] Chat input is functional
- [ ] Results display is professional and readable

### Phase 4: Integration
- [ ] SonnySidePanel renders new interfaces correctly
- [ ] Agent selection dropdown works
- [ ] Panel collapse/expand works
- [ ] Width resizing works
- [ ] Workspace integration works
- [ ] Tile creation from agent responses works
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No console errors

---

## 🚀 Deployment Strategy

### Step 1: Shared Components (Week 1)
1. Create all shared components
2. Test in isolation
3. Create Storybook stories (optional)
4. Merge to main

### Step 2: Agent Interfaces (Week 2-3)
1. Implement Clinical and Patent (highest priority)
2. Test thoroughly
3. Implement Financial and Market
4. Implement Regulatory and Target Biology
5. Merge incrementally

### Step 3: Sonny Interface (Week 4)
1. Implement SonnyHeroInterface
2. Integrate with SonnySidePanel
3. Test orchestration flow
4. Merge to main

### Step 4: Cleanup (Week 5)
1. Remove old interfaces (or archive)
2. Update documentation
3. Final testing
4. Production deployment

---

## 🎯 Success Criteria

1. **Visual Consistency:** All agents use same layout pattern, agent-specific theming
2. **Functionality:** All existing features work in new interfaces
3. **Performance:** No performance degradation
4. **User Experience:** Cleaner, more focused interfaces
5. **Maintainability:** Shared components reduce code duplication
6. **Demo Ready:** Perfect for pitch presentations

---

## 📚 Additional Notes

### Preserving Existing Features

**Document Upload:**
- Patent agent already has robust upload
- Financial agent has document analysis
- Preserve these implementations, integrate into new `DocumentUploadZone`

**Export Functionality:**
- Some agents have export buttons
- Integrate into new `ExportDropdown`
- Preserve existing export logic

**Chat Interface:**
- All agents have chat input at bottom
- Preserve existing chat functionality
- Integrate into `AgentInterfaceLayout` chat section

### Migration Path

**Option 1: Big Bang (Recommended for Demo)**
- Implement all at once
- Switch via feature flag
- Test thoroughly before demo

**Option 2: Gradual Migration**
- Implement one agent at a time
- Test each before moving to next
- Lower risk, longer timeline

---

## 🔄 Rollback Plan

If issues arise:
1. Feature flag: `USE_HERO_SKILLS = false`
2. Revert to old interfaces
3. Investigate issues
4. Fix and re-enable

---

## 📞 Questions & Considerations

1. **Analysis Results Display:** Where do Hero Skill results appear?
   - New panels within agent interface?
   - Tiles on dashboard?
   - Both?

2. **Backend Integration:** Do Hero Skills need new API endpoints?
   - Likely reuse existing endpoints
   - May need new orchestration for Sonny's Executive Brief

3. **Demo Mode:** How should Hero Skills work in demo mode?
   - Use pre-computed results
   - Faster animations
   - Sample data

4. **Error Handling:** How to handle analysis failures?
   - Show error state in Hero Skill card
   - Display error message
   - Allow retry

---

## ✅ Final Checklist Before Starting

- [ ] Review current agent interfaces
- [ ] Understand existing API endpoints
- [ ] Review design system (colors, spacing, typography)
- [ ] Set up feature flag system
- [ ] Create shared components directory
- [ ] Begin Phase 1 implementation

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-19  
**Status:** Ready for Implementation

