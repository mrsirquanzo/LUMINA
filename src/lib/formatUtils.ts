/**
 * Formats a patent number by removing commas (no commas should be displayed)
 * Handles various formats: US11234567, US11,234,567, 11,234,567, etc.
 */
export function formatPatentNumber(patentNumber: string): string {
  if (!patentNumber) return patentNumber;
  
  // Remove all commas and whitespace, keep the format as-is otherwise
  const cleaned = patentNumber.replace(/[,\s]/g, '');
  
  return cleaned;
}
