# LUMINA Architecture Review

## Executive Summary

LUMINA is an enterprise-grade biotech intelligence platform designed for pharmaceutical R&D decision-making. It combines a sophisticated multi-agent AI system with a sleek, Apple-inspired dark UI to deliver target validation, competitive analysis, and strategic recommendations.

---

## 1. Project Structure

```
LUMINA/
├── src/
│   ├── App.tsx                    # Root orchestrator
│   ├── main.tsx                   # Vite entry point
│   ├── index.css                  # Global styles & animations
│   ├── components/
│   │   ├── Sidebar.tsx            # Left navigation panel
│   │   ├── Header.tsx             # Top bar with search/export
│   │   ├── SonnySidePanel.tsx     # Right AI assistant panel
│   │   ├── Tile.tsx               # Base tile component
│   │   ├── ScientistDashboard.tsx # Scientist persona view
│   │   ├── ScoutDashboard.tsx     # BD/Scout persona view
│   │   ├── tiles/                 # 16 specialized tile types
│   │   ├── agents/                # 8 agent components
│   │   ├── shared/                # Reusable UI components
│   │   └── views/                 # Page-level views
│   ├── lib/
│   │   ├── orchestrationEngine.ts # Multi-agent coordination
│   │   ├── multiAgentTypes.ts     # Type definitions
│   │   ├── agentPrompts.ts        # System prompts (5 agents)
│   │   ├── llm/                   # LLM client factory
│   │   └── mcp/                   # Model Context Protocol
│   ├── types/                     # TypeScript definitions
│   ├── constants/                 # Mock data (47KB)
│   ├── contexts/                  # React context providers
│   ├── hooks/                     # Custom React hooks
│   └── utils/                     # Utility functions
├── server/                        # Express backend
└── config files                   # Vite, Tailwind, TypeScript
```

**Tech Stack:**
- React 19 + TypeScript + Vite
- Tailwind CSS 3.4
- Framer Motion 12.23
- Recharts 3.5
- Express 5.2 (backend)

---

## 2. Left Side Panel (Sidebar)

**File:** `src/components/Sidebar.tsx` (~550 lines)

### Features
| Feature | Implementation |
|---------|----------------|
| Resizable | Drag handle, 200-500px range, default 288px |
| Collapsible | Toggle to 80px width |
| Persona Switch | Scientist (purple) / BD (orange) toggle |
| Navigation | Dashboard, Workspaces, Feed, Compare, History |
| State Persistence | localStorage for width + collapsed state |
| Keyboard Nav | Arrow keys, Home, End |

### Navigation Items
```typescript
const navItems = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'workspaces', icon: FolderOpen, label: 'Workspaces' },
  { id: 'feed', icon: Newspaper, label: 'Intelligence Feed' },
  { id: 'compare', icon: GitCompare, label: 'Compare' },
  { id: 'history', icon: History, label: 'History' },
];
```

### Persona Theming
- **Scientist:** `--color-primary: 191 90 242` (Purple #BF5AF2)
- **BD/Scout:** `--color-primary: 255 159 10` (Orange #FF9F0A)

---

## 3. Sonny Side Panel (AI Assistant)

**Files:**
- `SonnySidePanel.tsx` (~400 lines)
- `SonnyChatPanel.tsx` (~300 lines)
- `agents/MultiAgentCollaboration.tsx` (~800 lines)

### Features
| Feature | Implementation |
|---------|----------------|
| Resizable | 400-900px range, default 600px |
| Collapsible | Collapse to 60px |
| Execution Modes | Fast (parallel) / Thorough (sequential) |
| Document Upload | PDF/Excel analysis |
| Real-time Streaming | SSE events for live updates |
| Cost Tracking | Per-query cost estimation |
| Analysis History | Cached results storage |

### Execution Modes
```typescript
// Fast Mode: ~2-3 seconds, $0.10-0.30
// All agents run in parallel, minimal iterations

// Thorough Mode: ~5-10 seconds, $0.30-0.80
// Agents ask questions, iterate on findings
```

### Authentication Flow
1. Check `/api/auth/check` on mount
2. Show LoginModal if unauthenticated
3. Enable demo mode for unauthenticated users

---

## 4. Dashboard Layout

**Main Structure (`App.tsx`):**
```tsx
<div className="flex h-screen">
  <Sidebar />           {/* Left panel */}
  <main className="flex-1 flex flex-col">
    <Header />          {/* Top bar */}
    <div id="main-content">
      {/* View content with gradient blob */}
      {currentView === 'dashboard' && <Dashboard />}
    </div>
  </main>
  <SonnySidePanel />    {/* Right panel */}
</div>
```

### Grid System
- **Mobile:** 1 column
- **Tablet (md):** 2 columns
- **Desktop (xl):** 4 columns
- **Gap:** 1.5rem (24px)

### View Routing
```typescript
type ViewState = 'dashboard' | 'feed' | 'workspaces' | 'compare' | 'history';
```

---

## 5. Tiles System

**Base Component:** `src/components/Tile.tsx` (~600 lines)

### Props Interface
```typescript
interface TileProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  dataFreshness?: string;
  verified?: boolean;
  aiGenerated?: boolean;
  tileType?: 'genetic' | 'expression' | 'clinical' | 'safety' |
             'market' | 'ip' | 'deal' | 'general';
  references?: Citation[];
  methodology?: string;
  extendedIntelligence?: React.ReactNode;
}
```

### Tile Features
1. **Header:** Title + icon + subtitle + data freshness badge
2. **Citation System:** Parses `[1]`, `[2]` with hover tooltips
3. **Expand Mode:** Full-screen modal view
4. **Chat Interface:** Agent conversation per tile
5. **Loading State:** Skeleton shimmer animation

### 16 Specialized Tiles

**Scientist Dashboard:**
| Tile | Purpose | Span |
|------|---------|------|
| ExecutiveSummary | Overall score & recommendation | 4 cols |
| ExpressionBiology | GTEx/TCGA expression data | 4 cols |
| Mechanistic | MOA & pathway analysis | 2 cols |
| ClinicalPrecedent | Similar trial outcomes | 2 cols |
| GeneticValidation | GWAS, pLI, LOEUF metrics | 2 cols |
| Druggability | Target tractability | 2 cols |
| SafetyAssessment | Toxicity risks | 2 cols |
| KeyExperiments | Critical data points | 2 cols |

**Scout Dashboard:**
| Tile | Purpose | Span |
|------|---------|------|
| BDExecutiveSummary | Strategic opportunity | 4 cols |
| ScientificValidation | Evidence summary | 2 cols |
| CompetitiveLandscape | Competitor analysis | 2 cols |
| ClinicalPositioning | Market positioning | 2 cols |
| IPFreedomToOperate | Patent landscape | 2 cols |
| MarketOpportunity | TAM/SAM analysis | 2 cols |
| DealLandscape | M&A comparables | 2 cols |
| StrategicRecommendation | Go/No-Go decision | 4 cols |

---

## 6. Multi-Agent System

**Core Files:**
- `lib/orchestrationEngine.ts` - Coordination logic
- `lib/llm/agentConfig.ts` - Model assignments
- `lib/agentPrompts.ts` - System prompts

### Agent Architecture
```typescript
// Full implementation (6 agents)
type AgentType = 'clinical' | 'patent' | 'financial' |
                 'market_research' | 'regulatory' | 'target_biology';
```

### Agent-to-Model Mapping

#### All Implemented Agents
| Agent | Model | Provider | Purpose |
|-------|-------|----------|---------|
| Clinical Data Analyst | claude-sonnet-4 | Anthropic | Trial analysis, efficacy/safety |
| Patent Expert | sonar-pro | Perplexity | Real-time USPTO searches |
| Financial Analyst | gemini-2.0-flash | Google | Deal valuation, M&A |
| Market Research | sonar-pro | Perplexity | Competitive intelligence |
| Regulatory Specialist | claude-sonnet-4 | Anthropic | FDA pathway guidance |
| **Target Biology Specialist** | claude-sonnet-4 | Anthropic | Genetic validation, druggability |
| **Synthesis** | claude-sonnet-4 | Anthropic | Final integration |

### Orchestration Flow
```
1. Plan Creation → sendEvent('plan_created')
2. Agent Execution:
   - Fast: Parallel execution
   - Thorough: Sequential with inter-agent questions
3. Agent Communication: [ASK_CLINICAL: "..."] syntax
4. Synthesis: Combine all findings
5. Completion → sendEvent('complete')
```

### Inter-Agent Communication
```typescript
// Agents can ask questions to other agents
"[ASK_CLINICAL: What is the ORR for the Phase 2 trial?]"
"[ASK_PATENT: Are there blocking patents from Roche?]"
"[ASK_TARGET_BIOLOGY: What is the genetic validation for this target?]"
```

---

## 6.1 Target Biology Agent (Implemented)

**Status:** ✅ Core Implementation Complete (LLM-Based)

### Purpose
The Target Biology Agent provides comprehensive target validation analysis using LLM reasoning to assess:
- Genetic validation (GWAS associations, constraint metrics)
- Druggability assessment (protein class, tractability, existing compounds)
- Expression biology (tissue expression, tumor vs normal)
- Safety signals from genetic data
- Mechanism of action clarity
- Translational confidence

### Current Implementation (LLM-Based)

**Architecture:** The agent uses Claude Sonnet 4 with comprehensive prompts to analyze target biology. It leverages the LLM's training data and can process uploaded documents for enhanced analysis.

**Implemented Architecture:**
```
lib/
├── agentPrompts.ts                 # ✅ Comprehensive target_biology prompt
├── llm/agentConfig.ts              # ✅ Agent configuration
├── multiAgentTypes.ts              # ✅ Type definitions
└── orchestrationEngine.ts          # ✅ Orchestration integration

app/api/agents/
└── target-biology/
    └── route.ts                    # ✅ Next.js API route

components/agents/
└── TargetBiologyAgent.tsx          # ✅ React component with UI

app/ai-projects/
└── target-biology-demo/
    └── page.tsx                    # ✅ Standalone demo page
```

### Agent Configuration
```typescript
// lib/llm/agentConfig.ts
target_biology: {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 1.0,
  apiKey: process.env.ANTHROPIC_API_KEY,
}
```

### API Endpoints
```typescript
// POST /api/agents/target-biology - Full assessment
{
  messages: Message[],              // Conversation history
  documents?: ProcessedDocument[],   // Optional document uploads
  targetSymbol?: string,            // Optional target context
  analysisType?: string,            // Optional analysis type
  context?: string                  // Optional additional context
}

// GET /api/agents/target-biology - Agent info and capabilities
```

### Features

**✅ Implemented:**
- Comprehensive system prompt covering genetic validation, druggability, expression, MOA, and translational confidence
- Document upload and analysis (PDF, Excel, images)
- Authentication integration
- Demo and Live modes
- Export functionality
- Integration with orchestration engine (Fast and Thorough modes)
- Inter-agent communication support (`[ASK_TARGET_BIOLOGY: "..."]`)
- React component with full UI
- Standalone demo page

**🔄 Future Enhancements (Planned):**
- External API integrations (Open Targets, gnomAD, ChEMBL, UniProt, PubMed)
- Structured data models with Zod schemas
- Response caching and rate limiting
- Quick assessment endpoint
- MCP provider for biology databases

### Integration Points

**1. Orchestration Engine:**
- ✅ Included in `createInitialPlan` valid agents list
- ✅ Supports Fast mode (parallel execution)
- ✅ Supports Thorough mode (sequential with context)
- ✅ Inter-agent communication enabled

**2. React Component:**
- ✅ Standalone demo page at `/ai-projects/target-biology-demo`
- ✅ File upload support
- ✅ Real-time conversation interface
- ✅ Export functionality

**3. Inter-Agent Communication:**
```typescript
// Other agents can ask target_biology
"[ASK_TARGET_BIOLOGY: What is the genetic validation for this target?]"
"[ASK_TARGET_BIOLOGY: What is the druggability assessment?]"
"[ASK_TARGET_BIOLOGY: What are the key biological risks?]"
```

### Implementation Status
| Component | Status | Files |
|-----------|--------|-------|
| Agent Prompt | ✅ Complete | `lib/agentPrompts.ts` |
| Agent Configuration | ✅ Complete | `lib/llm/agentConfig.ts` |
| Type Definitions | ✅ Complete | `lib/multiAgentTypes.ts` |
| Orchestration Integration | ✅ Complete | `lib/orchestrationEngine.ts` |
| MCP Integration | ✅ Complete (empty mapping) | `lib/mcp/mcpClient.ts` |
| API Route | ✅ Complete | `app/api/agents/target-biology/route.ts` |
| React Component | ✅ Complete | `components/agents/TargetBiologyAgent.tsx` |
| Demo Page | ✅ Complete | `app/ai-projects/target-biology-demo/page.tsx` |
| **External API Clients** | 🔄 **Planned** | Not yet implemented |
| **Data Models** | 🔄 **Planned** | Not yet implemented |
| **Caching/Rate Limiting** | 🔄 **Planned** | Not yet implemented |

### Architecture Decision
**Current:** TypeScript/Node.js with LLM-based analysis

**Rationale:**
- Seamless integration with existing Next.js architecture
- Single codebase, unified deployment
- End-to-end type safety
- Lower operational complexity
- LLM provides comprehensive analysis without external API dependencies

**Future:** External API integrations can be added incrementally as enhancements without breaking existing functionality.

---

## 7. Design Philosophy

### Visual Identity
**Inspiration:** Apple Human Interface Guidelines (Dark Mode)

### Color System
```javascript
colors: {
  background: '#000000',        // Pure black
  surface: '#1C1C1E',           // Card backgrounds
  surfaceHighlight: '#2C2C2E',  // Hover states
  surfaceElevated: '#3A3A3C',   // Elevated elements
  primary: 'rgb(var(--color-primary))', // Dynamic theme
  success: '#30D158',           // Green
  warning: '#FF9F0A',           // Amber
  danger: '#FF453A',            // Red
  info: '#0A84FF',              // Blue
  textPrimary: '#F5F5F7',       // Primary text
  textSecondary: '#86868B',     // Secondary text
  textTertiary: '#636366',      // Tertiary text
}
```

### Glassmorphism Effects
```css
.glass {
  background: rgba(28, 28, 30, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-elevated {
  background: rgba(58, 58, 60, 0.8);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

### Animation System
| Animation | Duration | Easing |
|-----------|----------|--------|
| Fade In | 300ms | ease-in-out |
| Modal Enter | 200ms | ease-out |
| Slide Up | 300ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Skeleton Shimmer | 1500ms | linear (infinite) |
| Pulse Glow | 2000ms | ease (infinite) |

### Framer Motion Patterns
```typescript
const tileVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
};
```

---

## 8. UI/UX Design Principles

### Layout Principles
1. **Three-Panel Layout:** Sidebar | Content | Sonny Panel
2. **Responsive Grid:** 1 → 2 → 4 columns
3. **Consistent Spacing:** 4px base unit (Tailwind scale)
4. **Visual Hierarchy:** Size, color, position

### Interaction Patterns
1. **Hover States:** Subtle brightness/elevation changes
2. **Focus Rings:** Primary color with 50% opacity
3. **Active States:** Scale(0.98) micro-interaction
4. **Transitions:** 200-300ms for smooth feel

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+K` | Focus search / Open Sonny |
| `Cmd/Ctrl+1` | Scientist view |
| `Cmd/Ctrl+2` | Scout view |
| `Cmd/Ctrl+E` | Export modal |
| `Cmd/Ctrl+J` | Toggle Sonny panel |
| `Escape` | Close modals |

### Accessibility Features
- Skip link for keyboard navigation
- ARIA labels on interactive elements
- Focus trap in modals
- Screen reader support (`.sr-only`)
- Reduced motion support (`prefers-reduced-motion`)

### Loading States
1. **Skeleton UI:** Shimmer effect placeholders
2. **Agent Thinking:** Animated ellipsis indicator
3. **Progress Indicators:** Step-by-step synthesis
4. **Connection Status:** Real-time badges

---

## 9. State Management

### Context Providers
```typescript
// Persona Context
<PersonaProvider activePersona={persona} setActivePersona={setPersona}>

// Target Context
<TargetProvider currentTarget={target} setCurrentTarget={setTarget}>
```

### Local Storage Keys
| Key | Purpose |
|-----|---------|
| `lumina-sidebar-collapsed` | Sidebar state |
| `lumina-sidebar-width` | Sidebar width |
| `lumina-sonny-panel-collapsed` | Sonny panel state |
| `lumina-sonny-panel-width` | Sonny panel width |
| `sonnyPanelCollapsed` | Panel toggle state |

### Component Memoization
All major components use `React.memo()` for performance optimization.

---

## 10. Data Flow

```
User Action
    ↓
App.tsx (State Management)
    ↓
Context Providers (Persona, Target)
    ↓
┌─────────────────────────────────────────────┐
│ Sidebar          │ Dashboard    │ Sonny     │
│ (Navigation)     │ (Tiles)      │ (Agents)  │
└─────────────────────────────────────────────┘
    ↓                    ↓              ↓
Theme Change       Tile Render    Agent Query
    ↓                    ↓              ↓
CSS Variables      Mock Data      SSE Stream
                   (constants/)   (orchestrationEngine)
```

---

## 11. Backend Integration

### API Endpoints
- `POST /api/orchestrate` - Multi-agent analysis
- `GET /api/auth/check` - Authentication status
- `POST /api/auth/login` - User login

### SSE Event Types
```typescript
type SSEEvent =
  | { type: 'plan_created', data: { plan, mode, estimatedCost } }
  | { type: 'agent_start', data: { agent, status } }
  | { type: 'agent_thinking', data: { agent, thought } }
  | { type: 'agent_response', data: { agent, response } }
  | { type: 'agent_question', data: { from, to, question } }
  | { type: 'synthesis_start' }
  | { type: 'synthesis_chunk', data: { content } }
  | { type: 'complete', data: { synthesis, cost } }
  | { type: 'error', data: { message } };
```

---

## 12. Key Integration Points

### App.tsx Orchestration
- Theme switching via CSS variables
- Keyboard shortcut handling
- View routing
- Panel state coordination

### Sidebar → App Communication
- `onPersonaChange` triggers theme switch
- `onViewChange` updates content area
- `setCollapsed` manages layout

### Sonny Panel → Backend
- Sends queries to `/api/orchestrate`
- Receives SSE events for real-time updates
- Manages authentication flow

### Tiles → Data
- Pull from `constants/index.ts` (mock data)
- Citation parsing and rendering
- Agent conversation integration

---

## Summary

LUMINA demonstrates a well-architected biotech intelligence platform with:

1. **Clean Separation of Concerns:** Components, contexts, hooks, utilities
2. **Sophisticated Multi-Agent AI:** 6 fully implemented agents with 3 LLM providers
3. **Apple-Inspired Dark UI:** Glassmorphism, subtle animations, premium feel
4. **Dual Persona Support:** Scientist (purple) and BD/Scout (orange) themes
5. **Responsive Design:** Mobile-first with progressive enhancement
6. **Accessibility First:** WCAG-compliant with full keyboard support
7. **Real-time Updates:** SSE streaming for agent collaboration
8. **Performance Optimized:** Lazy loading, memoization, code splitting

### Agent Summary

| Agent | Status | Provider | Key Capability |
|-------|--------|----------|----------------|
| Clinical Data Analyst | ✅ Implemented | Anthropic | Trial analysis |
| Patent Expert | ✅ Implemented | Perplexity | USPTO searches |
| Financial Analyst | ✅ Implemented | Google | Deal valuation |
| Market Research | ✅ Implemented | Perplexity | Competitive intel |
| Regulatory Specialist | ✅ Implemented | Anthropic | FDA pathways |
| **Target Biology** | ✅ **Implemented** | Anthropic | Genetic validation, druggability (LLM-based) |
