# Agent Integration Status in LUMINA Dashboard

## Current Integration Architecture

### 1. **Primary Integration Point: Sonny Side Panel**

**Location:** Right-side persistent panel (`SonnySidePanel.tsx`)

**How it works:**
- **Persistent Panel**: Always visible on the right side of the dashboard
- **Collapsible & Resizable**: Can be collapsed to 60px width or expanded (400-900px)
- **State Management**: Panel state (collapsed/expanded, width) persists in `localStorage`
- **Keyboard Shortcut**: `⌘+J` (or `Ctrl+J`) toggles panel

**Features:**
- ✅ **Demo/Live Mode Toggle**: Switch between demo (pre-recorded) and live (real API) modes
- ✅ **Authentication**: Password-protected Live mode (default: `demo2024`)
- ✅ **Execution Modes**: Fast (~30s) or Thorough (~2-3min) analysis
- ✅ **Multi-Agent Collaboration**: Uses `MultiAgentCollaboration` component
- ✅ **Query Input**: Users can ask Sonny questions directly in the panel

**Code Flow:**
```
App.tsx
  └─> SonnySidePanel (right panel)
       └─> MultiAgentCollaboration (lazy loaded)
            └─> Makes SSE request to /api/agents/orchestrator
                 └─> Backend: server/api/agents/orchestrator.ts
                      └─> Calls orchestrationEngine.runOrchestration()
                           └─> Coordinates 5 specialized agents
```

### 2. **Header Search Integration**

**Location:** Top header bar (`Header.tsx`)

**How it works:**
- Global search bar in header
- When user submits query, it opens the Sonny panel if collapsed
- Query is passed to Sonny panel for processing

**Code:**
```typescript
// Header.tsx
const handleSearch = (query: string) => {
  if (onOpenSonnyPanel) {
    onOpenSonnyPanel(); // Opens Sonny panel
  }
  // Query gets passed to Sonny via panel state
};
```

### 3. **Tile Chat Integration (Partial)**

**Location:** Individual tiles (`Tile.tsx`)

**Current State:**
- ✅ **Chat UI exists**: Each expanded tile has a chat interface
- ❌ **Not connected to agents**: Chat messages are stored locally but not sent to backend
- ⚠️ **Placeholder**: The chat shows "Sonny Insight" but doesn't actually call agents yet

**What needs to be done:**
- Connect tile chat to Sonny orchestrator API
- Pass tile-specific context (e.g., "TROP2 expression data") to agents
- Stream agent responses back to tile chat

**Code Location:**
```typescript
// Tile.tsx lines 67-69, ~400-500 (chat section)
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
const [chatInput, setChatInput] = useState('');
const [isThinking, setIsThinking] = useState(false);
```

### 4. **Backend API Architecture**

**Express Server:** `server/index.ts`

**API Endpoints:**
1. **`/api/agents/orchestrator`** (POST)
   - Main endpoint for Sonny multi-agent orchestration
   - Uses Server-Sent Events (SSE) for real-time streaming
   - Requires authentication for live mode (skips auth for demo mode)
   - Supports Fast and Thorough execution modes

2. **`/api/auth/login`** (POST)
   - Password authentication for live mode
   - Sets session cookie (24-hour duration)

3. **`/api/auth/check`** (GET)
   - Checks if user is authenticated

**Orchestration Flow:**
```
User Query
  ↓
SonnySidePanel → POST /api/agents/orchestrator
  ↓
orchestrationEngine.runOrchestration()
  ↓
Creates execution plan
  ↓
Fast Mode: Parallel execution of all agents
Thorough Mode: Sequential with inter-agent communication
  ↓
Streams responses via SSE
  ↓
Frontend receives events and updates UI in real-time
```

### 5. **Agent System**

**Five Specialized Agents:**

1. **Data Analyst Agent** (`data_analyst`)
   - LLM: Claude Opus
   - Focus: Clinical data, trial results, biomarker analysis

2. **Patent Expert Agent** (`patent`)
   - LLM: Claude Opus
   - Focus: IP landscape, patent filings, FTO analysis

3. **Financial Analyst Agent** (`financial`)
   - LLM: Claude Opus
   - Focus: Financials, valuations, market cap, funding

4. **Regulatory Expert Agent** (`regulatory`)
   - LLM: Claude Opus
   - Focus: FDA approvals, regulatory pathways, compliance

5. **Market Research Agent** (`market_research`)
   - LLM: Claude Opus
   - Focus: Market size, competitors, commercial viability

**Sonny (Orchestrator):**
- Coordinates all 5 agents
- Synthesizes responses into final answer
- Manages inter-agent communication in Thorough mode

## Current Integration Status

### ✅ **Fully Integrated**

1. **Sonny Side Panel** - Complete integration
   - Authentication system
   - Demo/Live mode switching
   - Real-time streaming via SSE
   - Full agent orchestration

2. **Header Search** - Opens Sonny panel

3. **Backend Infrastructure** - Fully functional
   - Express server with auth
   - SSE streaming
   - Agent orchestration engine
   - LLM client factory (Claude, Gemini, Perplexity)

### ⚠️ **Partially Integrated**

1. **Tile Chat** - UI exists, not connected to agents
   - Chat interface present in all tiles
   - Messages stored locally only
   - No backend integration yet

### ❌ **Not Yet Integrated**

1. **Individual Agent UI** - Separate agent pages exist but not accessible from dashboard
   - `DataAnalystAgent.tsx`
   - `PatentExpertAgent.tsx`
   - `FinancialAnalystAgent.tsx`
   - `RegulatoryExpertAgent.tsx`
   - `MarketResearchAgent.tsx`

2. **File Upload in Tiles** - No file upload capability in tiles yet

3. **Context-Aware Queries** - Tiles don't pass their specific context to agents automatically

## Next Steps for Full Integration

### High Priority

1. **Connect Tile Chat to Agents**
   ```typescript
   // In Tile.tsx, when user sends chat message:
   - Extract tile context (title, data, type)
   - Call /api/agents/orchestrator with context
   - Stream response back to tile chat
   - Display agent responses in chat UI
   ```

2. **Context-Aware Queries**
   - Each tile should automatically include its context
   - Example: ExpressionBiologyTile → "Context: TROP2 expression data in solid tumors. Question: [user query]"

### Medium Priority

3. **File Upload in Tiles**
   - Allow users to upload documents directly in tiles
   - Pass documents to agents for analysis

4. **Agent-Specific Tile Actions**
   - Quick action buttons in tiles (e.g., "Ask Patent Expert", "Ask Financial Analyst")
   - Open Sonny panel with pre-configured agent focus

### Low Priority

5. **Individual Agent Views**
   - Add navigation to individual agent pages
   - Allow direct interaction with specific agents

6. **History & Saved Queries**
   - Save query history per tile
   - Allow users to revisit previous agent interactions

## Authentication Flow

```
1. User clicks "Live" button in Sonny panel
   ↓
2. If not authenticated → LoginModal appears
   ↓
3. User enters password (default: demo2024)
   ↓
4. POST /api/auth/login
   ↓
5. Backend verifies password
   ↓
6. Sets session cookie (24-hour expiration)
   ↓
7. User is now authenticated for live mode
   ↓
8. Subsequent API calls include auth cookie
   ↓
9. Backend checks auth via isAuthenticated middleware
```

## Demo vs Live Mode

**Demo Mode:**
- Uses pre-recorded scenarios from `demoMultiAgentScenarios.ts`
- No API calls made
- No authentication required
- Fast responses for testing/demo purposes

**Live Mode:**
- Makes real API calls to LLM providers
- Requires authentication
- Uses actual agent orchestration
- Supports Fast and Thorough execution modes
- Real-time streaming via SSE

## File Structure

```
lumina/
├── src/
│   ├── components/
│   │   ├── SonnySidePanel.tsx          ← Main agent UI
│   │   ├── Header.tsx                  ← Search integration
│   │   ├── Tile.tsx                    ← Tile chat (needs connection)
│   │   ├── agents/
│   │   │   └── MultiAgentCollaboration.tsx  ← Core agent component
│   │   └── shared/
│   │       └── LoginModal.tsx          ← Authentication UI
│   ├── lib/
│   │   ├── orchestrationEngine.ts      ← Agent coordination logic
│   │   ├── llm/                        ← LLM client implementations
│   │   └── multiAgentTypes.ts          ← Type definitions
│   └── App.tsx                         ← Main app with Sonny panel
├── server/
│   ├── api/
│   │   ├── agents/
│   │   │   └── orchestrator.ts         ← Main API endpoint
│   │   └── auth/
│   │       ├── login.ts                ← Login endpoint
│   │       └── check.ts                ← Auth check endpoint
│   └── lib/
│       └── auth.ts                     ← Auth utilities
```

## Summary

**Current State:** Sonny (the multi-agent orchestrator) is fully integrated via a persistent right-side panel. Users can ask questions, choose demo or live mode, and get comprehensive responses from all 5 specialized agents.

**Missing:** Tile-level chat integration - tiles have chat UI but don't connect to agents yet. This would allow users to ask questions specific to each tile's content.

**Architecture:** Clean separation between frontend (React) and backend (Express), with SSE for real-time streaming and cookie-based authentication for live mode.
