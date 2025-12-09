# Target Biology Agent - Quick Start Guide

## 🚀 Quick Implementation Checklist

### Phase 1: Setup (15 min)
```bash
# 1. Install dependencies
npm install zod
npm install --save-dev vitest @vitest/ui

# 2. Create directories
mkdir -p src/lib/{agents,clients/biology,models/biology,utils/biology}
mkdir -p server/api/agents
mkdir -p tests/{agents,clients/biology}
```

### Phase 2: Core Files (4-6 hours)

**Priority Order:**
1. ✅ Utilities (`cache.ts`, `rateLimiter.ts`) - 30 min
2. ✅ Models (`targetBiology.ts`) - 1 hour
3. ✅ API Clients (5 files) - 2-3 hours
4. ✅ Agent (`targetBiologyAgent.ts`) - 1-2 hours

### Phase 3: Integration (2-3 hours)

**Files to Modify:**
1. `src/lib/multiAgentTypes.ts` - Add `'target_biology'` to AgentType
2. `src/lib/llm/agentConfig.ts` - Add agent config
3. `src/lib/agentPrompts.ts` - Add agent prompt
4. `src/lib/orchestrationEngine.ts` - Add agent handling
5. `server/index.ts` - Register API route
6. `server/api/agents/target-biology.ts` - Create API route

### Phase 4: Tile Integration (1 hour)

**Files to Modify:**
1. `src/components/Tile.tsx` - Add chat handler
2. Update tile components to pass `targetSymbol`

---

## 📁 File Structure Summary

```
lumina/
├── src/lib/
│   ├── agents/
│   │   └── targetBiologyAgent.ts          [NEW]
│   ├── clients/biology/
│   │   ├── openTargetsClient.ts           [NEW]
│   │   ├── gnomadClient.ts                [NEW]
│   │   ├── chemblClient.ts                [NEW]
│   │   ├── uniprotClient.ts               [NEW]
│   │   └── pubmedClient.ts                [NEW]
│   ├── models/biology/
│   │   └── targetBiology.ts               [NEW]
│   ├── utils/biology/
│   │   ├── cache.ts                       [NEW]
│   │   └── rateLimiter.ts                 [NEW]
│   ├── multiAgentTypes.ts                 [MODIFY]
│   ├── llm/agentConfig.ts                 [MODIFY]
│   ├── agentPrompts.ts                    [MODIFY]
│   └── orchestrationEngine.ts             [MODIFY]
├── server/
│   ├── api/agents/
│   │   └── target-biology.ts              [NEW]
│   └── index.ts                           [MODIFY]
└── src/components/
    └── Tile.tsx                            [MODIFY]
```

---

## 🔑 Key Integration Points

### 1. AgentType Update
```typescript
// src/lib/multiAgentTypes.ts
export type AgentType = 
  | 'clinical' 
  | 'patent' 
  | 'financial' 
  | 'regulatory' 
  | 'market_research'
  | 'target_biology'; // ← ADD THIS
```

### 2. Agent Config
```typescript
// src/lib/llm/agentConfig.ts
target_biology: {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.3,
  apiKey: process.env.ANTHROPIC_API_KEY,
}
```

### 3. API Route Registration
```typescript
// server/index.ts
import targetBiologyRoutes from './api/agents/target-biology';
app.use('/api/agents/target-biology', targetBiologyRoutes);
```

### 4. Orchestration Integration
```typescript
// src/lib/orchestrationEngine.ts
if (agent === 'target_biology') {
  const targetSymbol = extractTargetSymbol(query);
  const biologyAgent = new TargetBiologyAgent(llmConfig);
  const report = await biologyAgent.assessTarget(targetSymbol);
  return { response: biologyAgent.formatScientistOutput(report) };
}
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Test specific file
npm test targetBiologyAgent
```

---

## 📝 Environment Variables

Add to `.env`:
```bash
NCBI_API_KEY=your_pubmed_api_key_here  # Optional but recommended
```

---

## ✅ Verification

After implementation, test with:
```bash
# Test API endpoint
curl -X POST http://localhost:3001/api/agents/target-biology \
  -H "Content-Type: application/json" \
  -d '{"targetSymbol": "EGFR", "indication": "lung cancer"}'

# Test in Sonny panel
"Assess EGFR as a target for lung cancer"

# Test in tile chat
"What is the genetic validation for TROP2?"
```

---

## 🐛 Common Issues

1. **"Invalid agent type"** → Check AgentType union includes 'target_biology'
2. **"Missing prompt"** → Check agentPrompts.ts has target_biology entry
3. **API rate limits** → Increase cache TTL, add delays between calls
4. **Target not found** → Check gene symbol spelling (case-sensitive)

---

## 📚 Full Documentation

See `TARGET_BIOLOGY_AGENT_IMPLEMENTATION_PLAN.md` for complete details.
