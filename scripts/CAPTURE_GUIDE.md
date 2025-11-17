# Live Demo Scenario Capture Guide

This guide explains how to capture live multi-agent analysis sessions and convert them into demo scenarios.

## Overview

We're capturing 4 scenarios:
1. **M&A Due Diligence** - GeneTech CAR-T acquisition
2. **Competitive Analysis** - Comparing CAR-T therapies
3. **Technology Licensing** - BioX mRNA platform
4. **Series B Investment** - NeuroCure Alzheimer's drug

**Total cost:** ~$1.50-2.00 ($0.35-0.45 per scenario)

## Step-by-Step Process

### Step 1: Setup Capture Script

1. Navigate to the multi-agent demo page: `http://localhost:3000/ai-projects/multi-agent-demo`
2. Open Browser DevTools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. Copy the contents of `scripts/captureInBrowser.js`
5. Paste into the console and press Enter
6. You should see: `✅ Event capture script loaded!`

### Step 2: Authenticate

1. Toggle from **Demo** to **Live** mode
2. If not authenticated, click "Log In to Continue"
3. Enter the password
4. Confirm you see "Live mode" is active

### Step 3: Run First Analysis (M&A Due Diligence)

1. Click on the first sample query:
   > "Should we acquire GeneTech for $800M? Analyze their Phase 2 CAR-T data, patent portfolio, and financials."

2. Watch the analysis run (15-20 seconds)
3. Wait for "Analysis Complete" message
4. In the console, run: `downloadCapturedEvents()`
5. Save the file as `ma-due-diligence.json`

### Step 4: Reset and Run Second Analysis (Competitive Analysis)

1. Click "← Back to input"
2. In console, run: `resetCapture()`
3. Click on the second sample query:
   > "Compare the competitive positioning of Kymriah, Yescarta, and Breyanzi..."

4. Wait for completion
5. Run: `downloadCapturedEvents()`
6. Save as `competitive-analysis.json`

### Step 5: Repeat for Remaining Scenarios

**Technology Licensing:**
- Query: "Should we license BioX's mRNA delivery platform for $50M upfront + royalties?..."
- Save as: `licensing-deal.json`

**Series B Investment:**
- Query: "Should we invest $25M in NeuroCure's Series B?..."
- Save as: `investment-decision.json`

### Step 6: Process Captured Events

For each captured file, run:

```bash
npx ts-node scripts/processCapturedEvents.ts \
  ma-due-diligence.json \
  ma-due-diligence \
  "Should we acquire GeneTech for \$800M? Analyze their Phase 2 CAR-T data, patent portfolio, and financials."
```

```bash
npx ts-node scripts/processCapturedEvents.ts \
  competitive-analysis.json \
  competitive-analysis \
  "Compare the competitive positioning of Kymriah, Yescarta, and Breyanzi. Which has the strongest patent protection and commercial potential?"
```

```bash
npx ts-node scripts/processCapturedEvents.ts \
  licensing-deal.json \
  licensing-deal \
  "Should we license BioX's mRNA delivery platform for \$50M upfront + royalties? Analyze the technology, IP strength, and financial terms."
```

```bash
npx ts-node scripts/processCapturedEvents.ts \
  investment-decision.json \
  investment-decision \
  "Should we invest \$25M in NeuroCure's Series B? Evaluate their Alzheimer's Phase 1 data, patent portfolio, and burn rate."
```

### Step 7: Update Demo Scenarios File

1. Review each generated file in `scripts/demo-*.ts`
2. Update document names if needed
3. Copy the scenario constants into `lib/demoMultiAgentScenarios.ts`
4. Update the `DEMO_SCENARIOS` array to include the new scenarios
5. Remove or comment out the old scenarios

### Step 8: Test and Commit

```bash
# Test the build
npm run build

# Test in demo mode
# Navigate to multi-agent demo, toggle to Demo mode, try each scenario

# Commit changes
git add lib/demoMultiAgentScenarios.ts scripts/
git commit -m "Update demo scenarios with live agent captures"
git push
```

## Troubleshooting

**Problem:** Events not capturing
- **Solution:** Make sure you pasted the capture script BEFORE running the analysis

**Problem:** Download doesn't work
- **Solution:** Check browser console for errors. Try `console.log(window.capturedEvents)` to see if events were captured

**Problem:** Processing script fails
- **Solution:** Verify the JSON file is valid. Check that it contains an array of events.

**Problem:** Demo doesn't play correctly
- **Solution:** Check that timestamps are relative (starting near 0). Verify event types match expected values.

## Event Types

The capture should include these event types:
- `plan_created` - Initial execution plan
- `agent_start` - Agent begins analysis
- `agent_thinking` - Agent processing
- `agent_response` - Agent provides analysis
- `agent_question` - Agent asks another agent
- `synthesis_start` - Final synthesis begins
- `synthesis_progress` - Synthesis updates
- `complete` - Analysis complete with final output

## Notes

- Each scenario takes 15-20 seconds to run
- Total capture time: ~5 minutes
- Processing time: ~2 minutes
- Cost: $0.35-0.45 per scenario
- The live agents now use improved models and APIs, so responses should be richer and more detailed than the old demos
