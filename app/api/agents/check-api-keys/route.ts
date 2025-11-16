import { NextResponse } from 'next/server';

export async function GET() {
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasGoogleKey = !!process.env.GOOGLE_API_KEY;
  const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;

  const allKeysConfigured = hasAnthropicKey && hasGoogleKey && hasPerplexityKey;

  const missingKeys: string[] = [];
  if (!hasAnthropicKey) missingKeys.push('ANTHROPIC_API_KEY');
  if (!hasGoogleKey) missingKeys.push('GOOGLE_API_KEY');
  if (!hasPerplexityKey) missingKeys.push('PERPLEXITY_API_KEY');

  return NextResponse.json({
    configured: allKeysConfigured,
    missingKeys,
    hasAnthropicKey,
    hasGoogleKey,
    hasPerplexityKey,
  });
}
