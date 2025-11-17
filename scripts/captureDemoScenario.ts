/**
 * Utility to capture live multi-agent analysis and convert to demo scenario format
 *
 * Usage:
 * 1. Run the live multi-agent analysis in the browser
 * 2. Open browser DevTools > Network tab
 * 3. Find the request to /api/agents/orchestrator
 * 4. Right-click > Copy > Copy Response
 * 5. Paste the SSE stream into a file named 'captured-events.txt'
 * 6. Run: npx ts-node scripts/captureDemoScenario.ts <scenario-id> <title> <description>
 */

import * as fs from 'fs';
import * as path from 'path';

interface CapturedEvent {
  type: string;
  data: any;
}

interface DemoEvent {
  type: string;
  timestamp: number;
  data: any;
}

function parseSSEStream(sseContent: string): CapturedEvent[] {
  const events: CapturedEvent[] = [];
  const lines = sseContent.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.substring(6); // Remove 'data: ' prefix
        const event = JSON.parse(jsonStr);
        events.push(event);
      } catch (e) {
        console.warn('Failed to parse event:', line);
      }
    }
    i++;
  }

  return events;
}

function convertToTimedEvents(events: CapturedEvent[]): DemoEvent[] {
  const timedEvents: DemoEvent[] = [];
  let currentTime = 0;

  for (const event of events) {
    // Assign timestamps based on event type
    let delay = 0;

    switch (event.type) {
      case 'plan_created':
        delay = 0;
        break;
      case 'agent_start':
        delay = 500;
        break;
      case 'agent_thinking':
        delay = 700;
        break;
      case 'agent_response':
        delay = 1500;
        break;
      case 'agent_question':
        delay = 400;
        break;
      case 'synthesis_start':
        delay = 500;
        break;
      case 'synthesis_progress':
        delay = 1000;
        break;
      case 'complete':
        delay = 1500;
        break;
      default:
        delay = 500;
    }

    currentTime += delay;

    timedEvents.push({
      type: event.type,
      timestamp: currentTime,
      data: event.data,
    });
  }

  return timedEvents;
}

function generateDemoScenario(
  scenarioId: string,
  title: string,
  description: string,
  query: string,
  documents: string[],
  events: DemoEvent[]
): string {
  const lastEvent = events[events.length - 1];
  const estimatedDuration = lastEvent.timestamp + 1000;

  return `/**
 * Demo Scenario: ${title}
 */
export const DEMO_${scenarioId.toUpperCase().replace(/-/g, '_')}: DemoScenario = {
  id: '${scenarioId}',
  title: '${title}',
  description: '${description}',
  query: \`${query}\`,
  documents: ${JSON.stringify(documents, null, 2)},
  estimatedDuration: ${estimatedDuration},
  events: ${JSON.stringify(events, null, 2)},
};
`;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.log('Usage: npx ts-node scripts/captureDemoScenario.ts <scenario-id> <title> <description> <query> <input-file>');
    console.log('');
    console.log('Example:');
    console.log('  npx ts-node scripts/captureDemoScenario.ts \\');
    console.log('    ma-due-diligence \\');
    console.log('    "M&A Due Diligence" \\');
    console.log('    "Comprehensive analysis of a gene therapy acquisition" \\');
    console.log('    "Should we acquire GeneTech for $800M?" \\');
    console.log('    captured-events.txt');
    process.exit(1);
  }

  const [scenarioId, title, description, query, inputFile] = args;

  // Read the captured SSE stream
  const inputPath = path.join(process.cwd(), inputFile);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const sseContent = fs.readFileSync(inputPath, 'utf-8');
  console.log('Parsing SSE stream...');

  const capturedEvents = parseSSEStream(sseContent);
  console.log(`Parsed ${capturedEvents.length} events`);

  const timedEvents = convertToTimedEvents(capturedEvents);
  console.log(`Generated ${timedEvents.length} timed events`);

  // Extract documents from events if available
  const documents = [
    'Document 1.pdf',
    'Document 2.pdf',
  ];

  const scenario = generateDemoScenario(
    scenarioId,
    title,
    description,
    query,
    documents,
    timedEvents
  );

  // Write output
  const outputPath = path.join(process.cwd(), `demo-${scenarioId}.ts`);
  fs.writeFileSync(outputPath, scenario);
  console.log(`\nDemo scenario written to: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Review the generated file');
  console.log('2. Copy the scenario into lib/demoMultiAgentScenarios.ts');
  console.log('3. Update the DEMO_SCENARIOS array');
}

main().catch(console.error);
