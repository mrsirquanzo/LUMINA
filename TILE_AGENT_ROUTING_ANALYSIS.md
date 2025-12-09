# Tile-to-Agent Routing Analysis

## Recommendation: **Hybrid Approach (Smart Routing + Sonny Option)**

### Option 1: Route to Specific Agent (Per Tile) ⭐ **RECOMMENDED**
**Pros:**
- ✅ **Faster responses** (~30s vs 2-3min)
- ✅ **Lower cost** (1 API call vs 5)
- ✅ **More focused answers** - agent specializes in that domain
- ✅ **Better UX** - users get relevant answers quickly
- ✅ **Clear mapping** - each tile has obvious agent match

**Cons:**
- ❌ Less comprehensive (no multi-agent synthesis)
- ❌ Users might miss cross-domain insights

### Option 2: Route All Through Sonny (Multi-Agent)
**Pros:**
- ✅ Comprehensive analysis from all agents
- ✅ Cross-domain insights
- ✅ Consistent architecture (one endpoint)

**Cons:**
- ❌ **Slower** (2-3min vs 30s)
- ❌ **Higher cost** (5x API calls)
- ❌ May be overkill for simple tile-specific questions
- ❌ Less focused answers

### Option 3: Hybrid (Smart Routing with Sonny Option) ⭐ **BEST**
**Pros:**
- ✅ **Default to specific agent** (fast, focused)
- ✅ **Option to "Get Comprehensive Analysis"** → routes to Sonny
- ✅ Best of both worlds
- ✅ Users choose based on need

**Cons:**
- More complex UI (need upgrade button)

---

## Recommended Tile-to-Agent Mapping

### Scientist Dashboard Tiles

| Tile | Type | Best Agent | Rationale |
|------|------|------------|-----------|
| **ExecutiveSummaryTile** | general | **Sonny** (all agents) | Comprehensive overview needs all perspectives |
| **ExpressionBiologyTile** | expression | **Data Analyst** | Biological/expression data analysis |
| **MechanisticTile** | general | **Data Analyst** | Mechanism of action = biological data |
| **ClinicalPrecedentTile** | clinical | **Data Analyst** | Clinical trial data analysis |
| **GeneticValidationTile** | genetic | **Data Analyst** | Genetic validation = data analysis |
| **DruggabilityTile** | general | **Data Analyst** | Drug design = biological data |
| **SafetyAssessmentTile** | safety | **Regulatory Expert** | Safety = regulatory focus |
| **KeyExperimentsTile** | general | **Data Analyst** | Experimental data analysis |

### Scout Dashboard Tiles

| Tile | Type | Best Agent | Rationale |
|------|------|------------|-----------|
| **BDExecutiveSummaryTile** | market | **Sonny** (all agents) | BD needs comprehensive view |
| **ScientificValidationTile** | general | **Data Analyst** | Clinical/scientific data |
| **CompetitiveLandscapeTile** | market | **Market Research** | Competitive analysis = market focus |
| **ClinicalPositioningTile** | clinical | **Data Analyst** OR **Regulatory** | Clinical data (regulatory for positioning) |
| **IPFreedomToOperateTile** | ip | **Patent Expert** | Clear patent/IP focus |
| **MarketOpportunityTile** | market | **Market Research** | Market size/opportunity |
| **DealLandscapeTile** | deal | **Financial Analyst** | Deals = financial analysis |
| **StrategicRecommendationTile** | deal | **Market Research** OR **Financial** | Strategic = market + financial |

---

## Implementation Strategy

### Phase 1: Default Routing (Specific Agents)
Each tile routes to its primary agent by default:
- Fast response (~30s)
- Focused answer
- Lower cost

### Phase 2: Sonny Upgrade Option
Add "Get comprehensive analysis" button in chat:
- Routes to Sonny orchestrator
- Gets all 5 agents' perspectives
- More comprehensive but slower

### Phase 3: Context-Aware Routing
Automatically detect query type:
- Simple questions → specific agent
- Complex/cross-domain → Sonny

---

## Recommended Implementation

**Default: Specific Agent Routing**
- Map each tile to its best-fit agent
- Faster, cheaper, more focused

**Optional: Sonny Upgrade**
- Add button: "Get comprehensive analysis"
- Routes to Sonny for multi-agent view
- Gives users choice

**Context Enhancement**
- Always include tile context in query
- Example: "Context: TROP2 expression data in solid tumors. Question: [user query]"

---

## Example Mapping Function

```typescript
function getAgentForTile(tileType: string, tileTitle: string): 'specific' | 'sonny' | AgentType {
  // Executive summaries → Sonny (comprehensive)
  if (tileTitle.includes('Executive Summary')) {
    return 'sonny';
  }
  
  // Patent tiles → Patent Expert
  if (tileType === 'ip') {
    return 'patent';
  }
  
  // Market tiles → Market Research
  if (tileType === 'market') {
    return 'market_research';
  }
  
  // Deal tiles → Financial Analyst
  if (tileType === 'deal') {
    return 'financial';
  }
  
  // Safety/Regulatory → Regulatory Expert
  if (tileType === 'safety') {
    return 'regulatory';
  }
  
  // Clinical tiles → Data Analyst or Regulatory
  if (tileType === 'clinical') {
    return 'data_analyst'; // Could also be regulatory
  }
  
  // Default: Data Analyst (handles most biological/data questions)
  return 'data_analyst';
}
```

---

## Final Recommendation

**Start with specific agent routing** (Option 1) because:
1. **Better UX** - faster, more focused answers
2. **Lower cost** - 1 API call vs 5
3. **Clear mapping** - each tile has obvious agent
4. **Can upgrade later** - add Sonny option if users want comprehensive analysis

**Add Sonny option later** as an upgrade button:
- "Get comprehensive analysis from all agents"
- Routes to Sonny orchestrator
- Gives users choice between speed and comprehensiveness

This gives you the best balance of speed, cost, and user experience while maintaining flexibility for comprehensive analysis when needed.
