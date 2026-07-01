export function createSSEParser(): { push(text: string): unknown[] } {
  let carry = '';

  return {
    push(text: string): unknown[] {
      carry += text;
      const lines = carry.split('\n');
      // Keep the last element as carry - it may be a partial line
      carry = lines.pop() ?? '';

      const parsed: unknown[] = [];
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.substring(6);
        try {
          parsed.push(JSON.parse(raw));
        } catch {
          // Skip blank separators or partial lines that failed oddly
        }
      }
      return parsed;
    },
  };
}
