/**
 * Process captured events and generate demo scenario code
 *
 * Usage: npx ts-node scripts/processCapturedEvents.ts <captured-file.json> <scenario-id>
 */

import * as fs from 'fs';
import * as path from 'path';

interface CapturedEvent {
  type: string;
  data: any;
  captureTime: number;
}

interface DemoEvent {
  type: string;
  timestamp: number;
  data: any;
}

function processCapturedEvents(events: CapturedEvent[]): DemoEvent[] {
  const demoEvents: DemoEvent[] = [];

  // Normalize timestamps to start at 0
  const startTime = events[0]?.captureTime || 0;

  for (const event of events) {
    const relativeTime = event.captureTime - startTime;

    demoEvents.push({
      type: event.type,
      timestamp: relativeTime,
      data: event.data,
    });
  }

  return demoEvents;
}

function generateScenarioCode(
  scenarioId: string,
  events: DemoEvent[],
  query: string
): string {
  const lastEvent = events[events.length - 1];
  const estimatedDuration = lastEvent.timestamp + 1000;

  // Extract details from events
  const planEvent = events.find(e => e.type === 'plan_created');
  const completeEvent = events.find(e => e.type === 'complete');

  const title = scenarioId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `/**
 * Demo Scenario: ${title}
 * Generated from live capture on ${new Date().toISOString().split('T')[0]}
 */
export const DEMO_${scenarioId.toUpperCase().replace(/-/g, '_')}: DemoScenario = {
  id: '${scenarioId}',
  title: '${title}',
  description: 'Live-captured analysis showcasing current agent capabilities',
  query: \`${query.replace(/`/g, '\\`')}\`,
  documents: [
    'Document 1.pdf',
    'Document 2.pdf',
    'Document 3.pdf',
  ],
  estimatedDuration: ${estimatedDuration},
  events: [
${events.map(event => `    ${JSON.stringify(event, null, 0)}`).join(',\n')}
  ],
};
`;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: npx ts-node scripts/processCapturedEvents.ts <input-file.json> <scenario-id> <query>');
    console.log('');
    console.log('Example:');
    console.log('  npx ts-node scripts/processCapturedEvents.ts \\');
    console.log('    captured-events-123456.json \\');
    console.log('    ma-due-diligence \\');
    console.log('    "Should we acquire GeneTech for \\$800M?"');
    process.exit(1);
  }

  const [inputFile, scenarioId, query] = args;

  // Read captured events
  const inputPath = path.join(process.cwd(), inputFile);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const capturedEvents: CapturedEvent[] = JSON.parse(
    fs.readFileSync(inputPath, 'utf-8')
  );
  console.log(`📥 Loaded ${capturedEvents.length} captured events`);

  // Process events
  const demoEvents = processCapturedEvents(capturedEvents);
  console.log(`✅ Processed ${demoEvents.length} demo events`);
  console.log(`⏱️  Total duration: ${demoEvents[demoEvents.length - 1].timestamp}ms`);

  // Generate scenario code
  const scenarioCode = generateScenarioCode(scenarioId, demoEvents, query);

  // Write output
  const outputPath = path.join(process.cwd(), 'scripts', `demo-${scenarioId}.ts`);
  fs.writeFileSync(outputPath, scenarioCode);

  console.log('');
  console.log(`✅ Demo scenario written to: ${outputPath}`);
  console.log('');
  console.log('Event summary:');
  const eventCounts: Record<string, number> = {};
  demoEvents.forEach(e => {
    eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
  });
  Object.entries(eventCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('');
  console.log('Next steps:');
  console.log('1. Review the generated file');
  console.log('2. Update titles, descriptions, and document names');
  console.log('3. Copy into lib/demoMultiAgentScenarios.ts');
}

main().catch(console.error);
