# Agent Selector & Patent Upload - Implementation Plan

## 🎯 Current State Analysis

### What Exists:
- ✅ `PatentParsingPanel` component (ready to use)
- ✅ `CreateTileModal` component (ready to use)
- ✅ Dynamic tile system (fully implemented)
- ✅ SonnySidePanel with "Ask Sonny Anything" interface
- ✅ Agent metadata (`AGENT_INFO` with colors, icons)

### What's Missing:
- ❌ Agent selector in SonnySidePanel
- ❌ Integration of PatentParsingPanel into SonnySidePanel
- ❌ View switching based on selected agent
- ❌ Color theme changes based on agent

---

## 📋 Implementation Steps (In Order)

### Step 1: Add Agent Selector to SonnySidePanel ⭐ **REQUIRED FIRST**

**Why:** Users need to select which agent they want to interact with before they can access agent-specific features (like patent upload).

**What to Build:**
1. **Agent Selector UI** (dropdown or tabs)
   - Options: "Sonny (Multi-Agent)", "🔬 Clinical", "⚖️ Patent", "💰 Financial", "📋 Regulatory", "📊 Market Research", "🧬 Target Biology"
   - Default: "Sonny (Multi-Agent)"
   
2. **State Management**
   - Add `selectedAgent` state to SonnySidePanel
   - Store in localStorage for persistence
   - Update header/theme based on selection

3. **Color Theme System**
   - Apply agent color to panel when selected
   - Update header background/border
   - Update button colors
   - Keep it subtle (not full background)

**UI Design Options:**

**Option A: Dropdown (Space-efficient)**
```
┌─────────────────────────────────┐
│ [Sonny ▼] [Demo] [Live]         │
└─────────────────────────────────┘
```

**Option B: Tabs (More visible)**
```
┌─────────────────────────────────┐
│ [Sonny] [🔬] [⚖️] [💰] [📋] [📊] │
└─────────────────────────────────┘
```

**Option C: Segmented Control (Best UX)**
```
┌─────────────────────────────────┐
│ [Sonny] [🔬 Clinical] [⚖️ Patent]│
│ [💰 Financial] [📋 Regulatory]   │
└─────────────────────────────────┘
```

**Recommendation:** **Option B (Tabs)** - Most visible, easy to switch, shows all agents at once.

---

### Step 2: Conditional View Rendering

**What to Build:**
- When "Sonny" selected → Show current "Ask Sonny Anything" interface
- When "Patent" selected → Show `PatentParsingPanel` component
- When other agents selected → Show agent-specific interface (or chat for now)

**Implementation:**
```typescript
const [selectedAgent, setSelectedAgent] = useState<AgentType | 'sonny'>('sonny');

// In render:
{selectedAgent === 'sonny' && <MultiAgentCollaboration ... />}
{selectedAgent === 'patent' && <PatentParsingPanel ... />}
{selectedAgent === 'clinical' && <AgentChatInterface agent="clinical" ... />}
// etc.
```

---

### Step 3: Integrate PatentParsingPanel

**What to Build:**
- Import `PatentParsingPanel` into SonnySidePanel
- Render when `selectedAgent === 'patent'`
- Handle tile creation callback
- Show success message when tile is created

**Flow:**
1. User selects "Patent" agent
2. PatentParsingPanel appears
3. User uploads PDF
4. Parsing completes
5. User clicks "Add to Dashboard"
6. CreateTileModal opens
7. Tile created → Success message
8. User can navigate to dashboard to see tile

---

### Step 4: Color Theme Application

**What to Build:**
- Apply agent color to panel when selected
- Update header styling
- Update button colors
- Update accent colors

**Implementation:**
```typescript
const agentColors = {
  patent: 'purple',
  clinical: 'blue',
  financial: 'green',
  // etc.
};

// Apply to:
- Header border/background
- Primary buttons
- Progress indicators
- Active tab indicator
```

---

## 🎨 Recommended UI Flow

### Current Flow (Sonny):
```
SonnySidePanel
└── Ask Sonny Anything
    ├── Demo/Live toggle
    ├── Query input
    └── Start Analysis
```

### New Flow (With Agent Selector):
```
SonnySidePanel
├── Agent Selector (tabs)
│   [Sonny] [🔬] [⚖️] [💰] [📋] [📊]
│
└── Content (changes based on selection)
    ├── Sonny → Multi-Agent Collaboration
    ├── Patent → PatentParsingPanel
    ├── Clinical → Clinical Agent Interface
    └── etc.
```

---

## 📝 Detailed Implementation Checklist

### Phase 1: Agent Selector (Required First)
- [ ] Add agent selector state to SonnySidePanel
- [ ] Create agent selector UI (tabs recommended)
- [ ] Add agent icons and colors from AGENT_INFO
- [ ] Implement color theme switching
- [ ] Add localStorage persistence for selected agent
- [ ] Update header to show selected agent name

### Phase 2: View Switching
- [ ] Add conditional rendering based on selectedAgent
- [ ] Import PatentParsingPanel
- [ ] Render PatentParsingPanel when patent selected
- [ ] Keep Sonny view for 'sonny' selection
- [ ] Add placeholder views for other agents (or chat interface)

### Phase 3: Patent Integration
- [ ] Connect PatentParsingPanel to SonnySidePanel
- [ ] Handle tile creation callback
- [ ] Show success toast when tile created
- [ ] Optional: Auto-navigate to dashboard after tile creation

### Phase 4: Polish
- [ ] Smooth transitions between agent views
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design

---

## 🔄 User Flow After Implementation

1. **User opens SonnySidePanel**
   - Default: "Sonny" selected
   - Shows "Ask Sonny Anything" interface

2. **User clicks "⚖️ Patent" tab**
   - Panel theme changes to purple
   - Header shows "Patent Expert"
   - PatentParsingPanel appears

3. **User uploads patent PDF**
   - Drag & drop or click to browse
   - File validation
   - Parsing begins

4. **Parsing completes**
   - Results displayed
   - "Add to Dashboard" button appears

5. **User clicks "Add to Dashboard"**
   - CreateTileModal opens
   - User configures tile
   - Tile created

6. **User navigates to dashboard**
   - New tile appears
   - Can expand/collapse
   - Can pin/remove

---

## ⚠️ Important Considerations

### 1. **Agent Selector Must Come First**
**Why:** Without agent selection, users can't access PatentParsingPanel. The selector is the entry point.

### 2. **View State Management**
- Need to preserve view state when switching agents
- Don't lose uploaded files when switching
- Consider if user switches agents mid-parsing

### 3. **Color Theme Application**
- Keep it subtle (don't overwhelm)
- Use agent color for accents, not full backgrounds
- Ensure good contrast for readability

### 4. **Backward Compatibility**
- "Sonny" should still work as before
- Existing functionality shouldn't break
- Gradual rollout is possible

---

## 🎯 Recommended Implementation Order

### ✅ **DO THIS FIRST:**
1. **Add Agent Selector** (tabs in header)
2. **Add selectedAgent state**
3. **Implement view switching**
4. **Integrate PatentParsingPanel**

### ✅ **THEN:**
5. Add color themes
6. Add other agent interfaces
7. Polish and optimize

---

## 💡 Quick Answer to Your Question

**"Do we need to implement the different agents selector first before this?"**

**YES - The agent selector is required first** because:

1. **Entry Point:** Users need a way to select "Patent" agent to access patent upload
2. **View Routing:** The selector determines which view to show (Sonny vs Patent vs others)
3. **User Experience:** Clear separation between multi-agent (Sonny) and individual agents
4. **Future-Proof:** Sets foundation for adding other agent-specific interfaces

**Without the selector:**
- No way to access PatentParsingPanel
- No way to switch between different agent views
- Patent upload feature is inaccessible

**With the selector:**
- Clear navigation between agents
- Patent upload becomes accessible
- Foundation for future agent-specific features

---

## 🚀 Implementation Approach

### Option 1: Minimal (Fastest)
- Add simple dropdown selector
- Show PatentParsingPanel when patent selected
- Basic color theme
- **Time: ~1-2 hours**

### Option 2: Polished (Recommended)
- Tab-based selector with icons
- Smooth transitions
- Full color theme system
- Agent-specific headers
- **Time: ~3-4 hours**

### Option 3: Comprehensive (Future)
- All agents have dedicated interfaces
- Advanced features per agent
- Customizable layouts
- **Time: ~1-2 days**

**Recommendation:** Start with **Option 2** - gives good UX without over-engineering.

---

## 📋 Summary

**To test patent upload and tile generation, you need:**

1. ✅ **Agent Selector** (REQUIRED FIRST)
   - Add tabs/dropdown to SonnySidePanel
   - Allow selection of "Patent" agent
   
2. ✅ **View Switching**
   - Show PatentParsingPanel when patent selected
   - Show Sonny view when "Sonny" selected
   
3. ✅ **Integration**
   - Connect PatentParsingPanel
   - Handle tile creation
   - Show success feedback

**Current Status:**
- ✅ PatentParsingPanel exists and works
- ✅ Tile creation system works
- ❌ No way to access PatentParsingPanel (needs agent selector)
- ❌ No integration into SonnySidePanel

**Next Step:** Implement agent selector first, then integrate PatentParsingPanel.
