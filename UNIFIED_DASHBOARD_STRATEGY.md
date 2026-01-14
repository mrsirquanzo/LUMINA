# Unified Dashboard Strategy: The Complete Plan

## 🎯 The Core Vision

**Transform LUMINA from "dashboard + agents" to "intelligence that materializes"**

The "Aha Moment": Users watch 6 specialized AI agents work in parallel, their insights streaming into a coherent dashboard view in real-time.

---

## PART 1: The Orchestration Animation (The "Magic Moment")

### The Problem
Current state: Dashboard shows static tiles OR agents work separately. No connection.

### The Solution: "Watch Intelligence Materialize"

**Empty State → Search → Agents Orchestrate → Dashboard Populates**

This is the **centerpiece of the demo** and the core differentiator.

### Implementation Flow

```
User types "KRAS G12C" in search
    ↓
Dashboard shows empty state with "Initializing analysis..."
    ↓
Sonny Panel opens automatically, shows orchestration view:
    [✓] Target Biology Agent    → Genetic validation complete
    [⟳] Clinical Analyst        → Analyzing trials...
    [⟳] Patent Expert           → Searching USPTO...
    [○] Financial Analyst       → Queued...
    [○] Market Research         → Queued...
    [○] Regulatory Specialist  → Queued...
    ↓
As each agent completes:
    → Tile fades in on dashboard with their data
    → Agent status updates to [✓]
    → Progress bar advances
    ↓
Final synthesis tile appears when all agents complete
```

### Technical Implementation

**Key Components:**
1. **Orchestration Status Panel** - Shows agent progress in Sonny panel
2. **Tile Animation System** - Tiles fade in as agents complete
3. **Agent Status Tracking** - Real-time updates from agent APIs
4. **Demo Mode Enhancement** - Pre-computed data with real orchestration animation

**For Demo (Next Week):**
- Use pre-computed high-quality demo data (KRAS G12C scenario)
- Show real orchestration animation (even if data is pre-loaded)
- Live chat API calls for follow-up questions (shows real AI)

---

## PART 2: Simplified Agent UI - "One Primary Action + Advanced"

### The Problem
Current: 4 tabs × 6-8 modules = 24-32 options per agent → Choice paralysis

### The Solution: "Primary Action + Collapsed Advanced"

**Each agent shows:**
1. **One Primary Action** - The signature capability (from your table)
2. **Quick Examples** - 2-3 pre-filled examples
3. **Advanced Options** - Collapsed by default, expandable

### Agent UI Structure

```
┌────────────────────────────────────────────┐
│  🧬 Clinical Data Analyst                  │
│                                            │
│  PRIMARY ACTION:                           │
│  ┌──────────────────────────────────────┐ │
│  │ Enter NCT ID or paste trial data    │ │
│  │ [NCT02574455________________] [Go]  │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Quick Examples:                           │
│  • ASCENT (NCT02574455) - Trodelvy        │
│  • TROPION-Breast01 (NCT04656652)         │
│                                            │
│  ─────────────────────────────────────────│
│  Advanced Options  ▼                       │
│  (collapsed: Protocol comparison, safety)  │
│                                            │
│  ─────────────────────────────────────────│
│  Chat: Ask follow-up questions...         │
└────────────────────────────────────────────┘
```

### Agent Primary Actions (From Your Table)

| Agent | Primary Action | Input | Output |
|-------|---------------|-------|--------|
| **Clinical** | Analyze Trial Data | NCT ID or paste | Trial summary |
| **Patent** | Check FTO | Patent # or sequence | FTO risk score |
| **Financial** | Value This Asset | Company/deal | Valuation range + comps |
| **Market** | Size This Opportunity | Indication | TAM/SAM/SOM |
| **Regulatory** | Assess Pathway | Indication + modality | FDA pathway + timeline |
| **Target Biology** | Validate This Target | Gene name | Genetic/expression/druggability score |

**Advanced Options (Collapsed):**
- Clinical: Protocol comparison, safety profiling
- Patent: Claims extraction, landscape mapping
- Financial: DCF builder, scenario modeling
- Market: Competitor deep-dives, pricing analysis
- Regulatory: Orphan designation, accelerated pathways
- Target Biology: Detailed mechanism, safety signals

---

## PART 3: Dashboard ↔ Agent Bidirectional Connection

### Flow 1: Click Tile → Open Agent Context

**When user clicks a dashboard tile:**
1. Sonny panel auto-opens (if collapsed)
2. Switches to relevant agent
3. Pre-populates with tile's data context
4. Shows "Ask a follow-up question" prompt

**Example:**
```
User clicks "Genetic Validation" tile
    ↓
Sonny Panel:
    • Switches to Target Biology Agent
    • Shows: "TROP2 genetic validation data loaded"
    • Context: pLI: 0.12, LOEUF: 0.89
    • Suggested questions:
      - "Why is the pLI score low?"
      - "What do the biobank studies show?"
      - "Compare to validated cancer targets"
```

### Flow 2: Agent Updates → Tile Updates

**When agent provides new analysis:**
1. Agent responds with structured data
2. Relevant dashboard tile updates
3. Subtle animation shows tile was refreshed
4. "Updated 2 seconds ago" badge appears

**Example:**
```
User asks Financial Agent: "What's the valuation range?"
    ↓
Agent responds: "$1.5-2.5B estimate"
    ↓
"Deal Landscape" tile updates with new valuation
    ↓
Tile shows subtle pulse animation + "Updated 2s ago"
```

### Visual Indicators

**On Tiles:**
- "Generated by [Agent Name] • 2 seconds ago" badge
- Agent color border when showing their insights
- Click indicator: "Click to explore with [Agent]"

**In Agent Panel:**
- "This analysis will update the [Tile Name] tile" indicator
- Link to view tile on dashboard

---

## PART 4: Enhanced Demo Data & Scenarios

### Scenario 1: KRAS G12C (Primary Demo)

**Why KRAS G12C:**
- High-profile target (recent approvals)
- Rich data available (trials, patents, deals)
- Compelling story (from undruggable to blockbuster)

**Data Requirements:**
- Genetic validation: pLI, LOEUF, expression data
- Clinical trials: NCT numbers, phase data, outcomes
- Patents: USPTO numbers, FTO analysis
- Financial: Recent deal values, comps
- Market: TAM/SAM, competitive landscape
- Regulatory: FDA pathway, timeline

**Orchestration Sequence:**
1. Target Biology → Genetic validation (fast, 5s)
2. Clinical → Trial analysis (medium, 15s)
3. Patent → FTO check (medium, 20s)
4. Financial → Valuation (slow, 30s)
5. Market → Opportunity sizing (slow, 30s)
6. Regulatory → Pathway assessment (medium, 20s)
7. Sonny → Synthesis (fast, 10s)

**Total: ~2 minutes for full orchestration**

### Scenario 2: M&A Due Diligence (Backup)

**BioSpectra scenario** (already exists, enhance it):
- More detailed financial models
- Deeper patent analysis
- Realistic clinical data
- Regulatory pathway details

---

## PART 5: Pitch Presentation Flow (15 Minutes)

### Opening: The Problem (2 min)
*"Due diligence on a single target takes weeks. You're juggling ClinicalTrials.gov, USPTO, SEC filings, PubMed, and 15 browser tabs. By the time you synthesize everything, the deal window has closed."*

### ACT 1: The Magic Moment (3 min)
*"Watch this. I type 'KRAS G12C' and in 60 seconds, six specialized AI agents analyze genetics, clinical trials, patents, financials, market opportunity, and regulatory pathway—simultaneously."*

**Demo Flow:**
1. Show empty dashboard
2. Type "KRAS G12C" in search
3. Watch orchestration animation
4. Tiles fade in as agents complete
5. Point out: "Notice how each agent contributes their expertise"

### ACT 2: Depth When You Need It (5 min)
*"Every tile is backed by a specialized agent. Click Genetic Validation—now I can ask follow-up questions with full context."*

**Demo Flow:**
1. Click "Genetic Validation" tile
2. Show agent panel opening with context
3. Ask follow-up: "Why is the pLI score concerning?"
4. Show nuanced agent response
5. Demonstrate: "The agent knows I'm looking at KRAS"

### ACT 3: Two Personas, One Platform (3 min)
*"Switch to BD Scout mode. Same data, different lens. The scientist cares about pLI scores. BD cares about $5B market opportunity."*

**Demo Flow:**
1. Toggle persona (Scientist → BD Scout)
2. Show different dashboard tiles
3. Highlight: "Same intelligence, different presentation"

### CLOSING: The Vision (2 min)
*"This is version one. We're adding real-time patent monitoring, automated investment memo generation, and portfolio-level analytics. We're not building a tool—we're building the intelligence layer for biotech decision-making."*

---

## PART 6: Implementation Priority

### Week 1 (Before Pitch) - CRITICAL

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| 1. Orchestration animation UI | Medium | **Very High** | ⬜ |
| 2. KRAS G12C demo data prep | Low | **Very High** | ⬜ |
| 3. Simplify agent panels (one primary action) | Medium | **High** | ⬜ |
| 4. Tile click → agent context | Medium | **High** | ⬜ |
| 5. "Generated by" badges on tiles | Low | Medium | ⬜ |
| 6. Empty state dashboard | Low | Medium | ⬜ |

### Post-Pitch (Week 2-3)

| Task | Effort | Impact |
|------|--------|--------|
| 7. Agent updates → tile updates | High | High |
| 8. Real-time orchestration (not just demo) | High | High |
| 9. More demo scenarios | Medium | Medium |
| 10. Advanced options implementation | Medium | Medium |

---

## PART 7: Technical Architecture

### Orchestration Animation System

**Components:**
1. `OrchestrationStatusPanel` - Shows agent progress
2. `AgentStatusTracker` - Tracks agent completion
3. `TileAnimationController` - Manages tile fade-in animations
4. `DemoOrchestrationEngine` - Simulates agent workflow for demo

**State Management:**
```typescript
interface OrchestrationState {
  target: string;
  agents: {
    [key: string]: {
      status: 'queued' | 'running' | 'complete' | 'error';
      progress: number;
      result?: any;
    };
  };
  tiles: {
    [key: string]: {
      agent: string;
      data: any;
      status: 'pending' | 'animating' | 'visible';
    };
  };
}
```

### Agent UI Simplification

**New Component Structure:**
```
AgentInterface
├── PrimaryActionCard
│   ├── Input field
│   ├── Submit button
│   └── Quick examples
├── AdvancedOptions (collapsed)
│   └── Expandable section
└── ChatInterface
    └── Context-aware suggestions
```

### Tile-Agent Connection

**Tile Click Handler:**
```typescript
const handleTileClick = (tile: Tile) => {
  // Open Sonny panel
  setSonnyPanelCollapsed(false);
  
  // Switch to relevant agent
  setSelectedAgent(tile.agent);
  
  // Pre-populate context
  setAgentContext({
    tileId: tile.id,
    data: tile.data,
    suggestedQuestions: generateQuestions(tile),
  });
};
```

---

## PART 8: Key Talking Points

### "Why Multi-Agent?"
*"Each domain requires specialized reasoning. Claude excels at clinical interpretation. Perplexity has real-time patent databases. Gemini handles massive financial contexts. We pick the best model for each task."*

### "What's the Moat?"
*"Three layers: (1) The orchestration layer that makes agents collaborate, (2) The pharma-specific prompts and workflows we've built, (3) The proprietary data integrations we're adding."*

### "Who's the Customer?"
*"BD teams at mid-size pharma ($1-20B revenue) who do 50-100 target evaluations per year. Each evaluation currently takes 2-3 weeks. We compress it to 2-3 hours."*

### "Revenue Model?"
*"SaaS. $50K-200K/year per team. API credits on top for heavy usage. We're not competing on price—we're selling time compression."*

---

## PART 9: Success Metrics

**For the Pitch:**
- ✅ Investors understand: Multi-agent coordination is the differentiator
- ✅ They see: Intelligence materializing in real-time
- ✅ They feel: "This could replace our analyst team for initial due diligence"
- ✅ They ask: "When can we pilot this?"

**Post-Pitch:**
- User engagement: Time spent in orchestration view
- Tile interaction: Click-through rate from tiles to agents
- Agent usage: Which agents are used most
- Demo conversion: Demo → trial → paid

---

## Summary: The Unified Vision

**Before:**
```
Dashboard (static) + Agents (hidden) = Disconnected
```

**After:**
```
Dashboard (reactive) ← Agents (visible) = Unified Intelligence
```

**The "Aha Moment":**
Watching intelligence materialize. Not just seeing a filled dashboard, but seeing how it got filled—six specialists working in parallel, each contributing their domain expertise, results streaming into a coherent view.

**That's the demo. That's the product. That's the pitch.**

---

*Last updated: [Current Date]*
*Next review: After pitch feedback*

