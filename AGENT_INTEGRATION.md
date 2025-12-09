# Sonny Agent Integration Guide

## Overview

This document explains how Sonny (the multi-agent orchestrator) and all 5 specialized agents have been integrated into LUMINA.

## Architecture

### Backend Server (Express)
- **Location**: `/server`
- **Port**: 3001 (default)
- **Routes**:
  - `/api/agents/orchestrator` - Main Sonny orchestrator endpoint (SSE streaming)
  - `/api/upload` - File upload endpoint
  - `/api/fetch-url` - URL content fetching

### Frontend Integration
- **SonnyChat Component**: `/src/components/SonnyChat.tsx` - Simplified chat interface for Sonny
- **Tile Integration**: Each tile's chat panel now uses real Sonny API instead of mock responses
- **Header Search**: Can be extended to use Sonny for complex queries

## Running the System

### Development Mode

1. **Start Backend Server**:
   ```bash
   npm run dev:server
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Or run both together**:
   ```bash
   npm run dev:all
   ```

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Agent Integration

### 5 Specialized Agents

1. **Clinical Data Analyst** (Claude Sonnet 4)
   - Clinical trial analysis
   - Safety and efficacy data
   - Regulatory pathways

2. **Patent Expert** (Perplexity Sonar Pro)
   - IP landscape analysis
   - Freedom to operate
   - Patent searches

3. **Financial Analyst** (Gemini 2.0 Flash)
   - Financial modeling
   - Valuation analysis
   - Market sizing

4. **Market Research Analyst** (Perplexity Sonar Pro)
   - Competitive intelligence
   - Market trends
   - Real-time data

5. **Regulatory Specialist** (Claude Sonnet 4)
   - FDA pathways
   - Regulatory strategy
   - Approval timelines

### Sonny Orchestrator

Sonny coordinates all 5 agents based on the query:
- **Fast Mode**: Agents work in parallel
- **Thorough Mode**: Agents work sequentially, building on each other's insights

## Usage in LUMINA

### In Tile Chat Panels

When users ask questions in tile chat panels, Sonny:
1. Receives the query with tile context
2. Routes to appropriate specialist agents
3. Synthesizes responses
4. Returns formatted answer

### Example Query in Tile

User: "What does this expression data tell us about safety?"

Sonny orchestrates:
- Clinical agent analyzes safety implications
- Market agent provides competitive context
- Synthesis combines insights

## API Endpoints

### POST `/api/agents/orchestrator`

**Request Body**:
```json
{
  "query": "Your question here",
  "documents": [],
  "mode": "fast" | "thorough",
  "isDemo": false,
  "customAgents": ["clinical", "patent"],
  "mcpEnabled": false
}
```

**Response**: Server-Sent Events (SSE) stream with:
- `plan_created` - Execution plan
- `agent_start` - Agent begins analysis
- `agent_thinking` - Agent processing
- `agent_response` - Agent output
- `synthesis_start` - Synthesis begins
- `synthesis_progress` - Synthesis updates
- `complete` - Final synthesis

## Components Copied from Quan_Project

### Agent Components
- `MultiAgentCollaboration.tsx` - Full orchestrator UI
- `DataAnalystAgent.tsx`
- `PatentExpertAgent.tsx`
- `FinancialAnalystAgent.tsx`
- `MarketResearchAgent.tsx`
- `RegulatoryExpertAgent.tsx`

### Shared Components
- `FileUpload.tsx`
- `CitedMarkdown.tsx`
- `ExportButton.tsx`
- `CitationBadge.tsx`
- `ModelBadge.tsx`
- And more...

### Libraries
- LLM clients (Anthropic, Gemini, Perplexity)
- Orchestration engine
- Agent prompts and configuration
- MCP integration
- Demo scenarios

## Next Steps

1. **Test the Integration**: Start both servers and test queries in tile chats
2. **Configure API Keys**: Add your API keys to `.env`
3. **Customize Responses**: Adjust agent prompts in `/src/lib/agentPrompts.ts`
4. **Add Features**: 
   - Document upload in tiles
   - Full Sonny chat modal
   - Analysis history
   - Export capabilities

## Troubleshooting

### Backend not connecting
- Ensure backend server is running on port 3001
- Check Vite proxy configuration in `vite.config.ts`
- Verify CORS settings in `server/index.ts`

### API Key Errors
- Ensure all required API keys are in `.env`
- Check that keys are valid and have credits

### Import Errors
- Verify path aliases in `tsconfig.app.json` and `vite.config.ts`
- Run `npm install` to ensure all dependencies are installed
