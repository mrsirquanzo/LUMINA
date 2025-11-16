# Sonny Multi-Agent Collaboration System - Testing Guide

## Current Status

### ✅ What Can Be Tested Now (No API Key Required)

1. **Sonny Demo Mode**
   - Pre-recorded M&A scenario playback
   - SSE event streaming
   - Real-time UI updates
   - Agent dialogue visualization
   - Sonny synthesis generation
   - Export functionality

2. **UI Components**
   - Scenario selection
   - Mode toggle (Fast/Thorough)
   - Demo/Live toggle
   - Custom query input
   - Document upload interface
   - Cost display

3. **Integration**
   - Links from agent pages
   - Navigation to demo
   - Project page display

### ⚠️ What Requires API Key Configuration

1. **Live Orchestration**
   - Real Claude API calls
   - Inter-agent question routing
   - Dynamic synthesis generation
   - Actual cost tracking

2. **Cost Estimation**
   - Live cost calculation endpoint
   - Token estimation validation

## Testing Steps

### Step 1: Test Demo Mode ✅ (Ready to test)

**URL:** `http://localhost:3000/ai-projects/multi-agent-demo`

**Test Cases:**
1. Navigate to multi-agent demo page
2. Select "M&A Due Diligence" scenario
3. Keep "Demo Mode" selected
4. Select "Thorough Mode"
5. Click "Start Analysis"
6. **Expected Results:**
   - Plan appears immediately
   - Clinical Analyst starts analyzing
   - Agent responses stream in real-time
   - Question from Clinical to Patent appears
   - Patent Expert provides answer
   - Question from Patent to Financial appears
   - Financial Analyst provides answer
   - Synthesis starts
   - Final recommendation appears
   - Export buttons work (Copy/Download)

**Duration:** ~18 seconds

---

### Step 2: Test UI Components ✅ (Ready to test)

**Test Cases:**
1. **Scenario Selection:**
   - Click each of 4 scenarios
   - Verify selection highlights
   - Verify query text updates

2. **Mode Toggle:**
   - Switch between Fast/Thorough
   - Verify descriptions update
   - Verify cost estimates change

3. **Demo/Live Toggle:**
   - Toggle between modes
   - Verify messaging changes

4. **Custom Analysis:**
   - Click in custom query textarea
   - Verify custom mode activates
   - Upload a file (any PDF/Excel)
   - Verify file list appears

---

### Step 3: Test Integration ✅ (Ready to test)

**Test Cases:**
1. **From Clinical Data Analyst:**
   - Visit `/ai-projects/data-analyst-agent`
   - Scroll to "NEW: Multi-Agent Collaboration" section
   - Click "Launch Multi-Agent Demo" button
   - Verify redirects to demo page

2. **From Patent Expert:**
   - Visit `/ai-projects/patent-expert-agent`
   - Scroll to "NEW: Multi-Agent Collaboration" section
   - Click "Launch Multi-Agent Demo" button
   - Verify redirects to demo page

3. **From Financial Analyst:**
   - Visit `/ai-projects/financial-analyst-agent`
   - Scroll to "NEW: Multi-Agent Collaboration" section
   - Click "Launch Multi-Agent Demo" button
   - Verify redirects to demo page

4. **From AI Projects Index:**
   - Visit `/ai-projects`
   - Find "Multi-Agent Collaboration System" card
   - Click to view details
   - Visit `/ai-projects/multi-agent-collaboration`
   - Click "View Demo" button
   - Verify redirects to demo page

---

### Step 4: Configure API Key (Required for Live Testing)

**Option A: Using .env.local (Recommended)**

1. Create `.env.local` file in project root:
```bash
touch .env.local
```

2. Add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

3. Restart development server:
```bash
npm run dev
```

**Option B: Using Environment Variable**

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
npm run dev
```

**Verify Configuration:**
```bash
# This should return "✓ ANTHROPIC_API_KEY is set"
if [ -n "$ANTHROPIC_API_KEY" ]; then echo "✓ ANTHROPIC_API_KEY is set"; else echo "✗ ANTHROPIC_API_KEY is NOT set"; fi
```

---

### Step 5: Test Cost Estimation API (Requires API Key)

**Test via curl:**
```bash
curl -X POST http://localhost:3000/api/agents/orchestrator/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Should we acquire GeneTech for $800M?",
    "documents": [],
    "mode": "thorough"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "estimate": {
    "minCost": 0.30,
    "maxCost": 0.80,
    "estimatedIterations": 3,
    "agents": ["clinical", "patent", "financial"],
    "breakdown": [...]
  }
}
```

---

### Step 6: Test Live Orchestration (Requires API Key)

**⚠️ Warning: This will consume API credits (~$0.30-0.80 per run)**

**Test Cases:**

1. **Simple Query (Fast Mode):**
   - Navigate to demo page
   - Toggle to "Live Analysis"
   - Select "M&A Due Diligence" scenario
   - Select "Fast Mode"
   - Click "Start Analysis"
   - **Expected:** All 3 agents run in parallel, synthesis generated
   - **Cost:** ~$0.10-0.30

2. **Simple Query (Thorough Mode):**
   - Navigate to demo page
   - Toggle to "Live Analysis"
   - Select "M&A Due Diligence" scenario
   - Select "Thorough Mode"
   - Click "Start Analysis"
   - **Expected:** Agents run sequentially, may ask questions
   - **Cost:** ~$0.30-0.80

3. **Custom Query with Document:**
   - Upload a simple PDF (e.g., 1-page document)
   - Enter query: "Summarize the key points in this document"
   - Select "Fast Mode"
   - Click "Start Analysis"
   - **Expected:** Agents analyze document
   - **Cost:** Variable based on document size

---

### Step 7: Verify Inter-Agent Communication (Requires API Key)

**Test Case:**
- Run Thorough Mode with a query that should trigger questions
- Example: "Evaluate this gene therapy company for acquisition"
- **Expected Behavior:**
  1. Clinical Analyst analyzes, may ask Patent: "Are there blocking patents?"
  2. Patent Expert answers, may ask Financial: "What valuation premium for IP?"
  3. Financial Analyst sees both contexts
  4. Synthesis integrates all insights

**How to Verify:**
- Watch for "agent_question" events in UI
- See question/answer cards appear
- Verify answers are inserted into responses
- Check that subsequent agents reference previous insights

---

## Testing Checklist

### Demo Mode (No API Key Required) ✅
- [ ] Demo playback works
- [ ] SSE events stream correctly
- [ ] Agent responses appear in order
- [ ] Questions display properly
- [ ] Synthesis appears
- [ ] Export works (Copy/Download)
- [ ] Can play demo multiple times

### UI Components ✅
- [ ] Scenario selection highlights correctly
- [ ] Mode toggle works
- [ ] Demo/Live toggle works
- [ ] Custom query activates custom mode
- [ ] Document upload shows file list
- [ ] Cost estimates display
- [ ] Start button enables/disables correctly

### Integration ✅
- [ ] Clinical agent page links work
- [ ] Patent agent page links work
- [ ] Financial agent page links work
- [ ] AI projects index links work
- [ ] Multi-agent project page exists
- [ ] All CTAs use correct colors

### Live Mode (Requires API Key) ⚠️
- [ ] API key configured
- [ ] Cost estimation API works
- [ ] Fast mode runs successfully
- [ ] Thorough mode runs successfully
- [ ] Agents generate meaningful responses
- [ ] Custom query works with documents
- [ ] Cost tracking accurate

### Inter-Agent Communication (Requires API Key) ⚠️
- [ ] Agents ask questions when appropriate
- [ ] Questions route to correct agents
- [ ] Answers integrate into responses
- [ ] Context passes between agents
- [ ] Synthesis reflects all interactions

---

## Known Issues / Limitations

1. **Demo Mode Only Has 1 Scenario:**
   - Currently only M&A Due Diligence is pre-recorded
   - Other 3 scenarios work in live mode only

2. **Authentication:**
   - Live mode requires authentication (check `/api/auth/check`)
   - Demo mode bypasses authentication

3. **Cost Variability:**
   - Actual costs may vary from estimates
   - Depends on response length and iterations

4. **Error Handling:**
   - If API key invalid, shows generic error
   - Network failures may not be clearly reported

---

## Quick Test Commands

**Start dev server:**
```bash
npm run dev
```

**Check environment:**
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Check .env.local
cat .env.local | grep ANTHROPIC_API_KEY
```

**Test endpoints:**
```bash
# Health check
curl http://localhost:3000/api/auth/check

# Cost estimation (requires API key)
curl -X POST http://localhost:3000/api/agents/orchestrator/estimate \
  -H "Content-Type: application/json" \
  -d '{"query": "Test query", "documents": [], "mode": "fast"}'
```

---

## Success Criteria

### Phase 1: Demo Mode ✅
- [x] Demo plays without errors
- [x] UI updates in real-time
- [x] Export functionality works

### Phase 2: Live Mode ⚠️ (Pending API Key)
- [ ] Live orchestration completes successfully
- [ ] Cost tracking accurate
- [ ] Agents produce quality responses

### Phase 3: Inter-Agent Communication ⚠️ (Pending API Key)
- [ ] Questions appear in UI
- [ ] Answers integrated into responses
- [ ] Synthesis reflects collaboration

### Phase 4: Production Ready 🎯 (Future)
- [ ] Error handling comprehensive
- [ ] Rate limiting in place
- [ ] Logging and monitoring
- [ ] Performance optimized
