/**
 * Format LLM response for SMS delivery
 * Max 3 SMS segments = 459 characters (English) or 189 characters (Unicode)
 * We target 450 chars max to leave buffer
 */

const MAX_SMS_LENGTH = 450; // 3 segments with buffer

export function formatForSMS(text: string): string {
  // Remove markdown formatting that LLMs love to add
  let cleaned = text
    .replace(/\*\*/g, "") // bold
    .replace(/\*/g, "") // italic
    .replace(/#{1,6}\s/g, "") // headers
    .replace(/`{1,3}/g, "") // code blocks
    .replace(/\n{3,}/g, "\n\n") // excessive newlines
    .replace(/- /g, "• ") // convert markdown lists to bullet
    .trim();

  // If already within limits, return as-is
  if (cleaned.length <= MAX_SMS_LENGTH) {
    return cleaned;
  }

  // Truncate at sentence boundary
  const truncated = truncateAtSentence(cleaned, MAX_SMS_LENGTH);
  return truncated;
}

/**
 * Truncate text at the nearest sentence boundary before maxLength
 */
function truncateAtSentence(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find the last sentence-ending punctuation before maxLength
  const substring = text.substring(0, maxLength);
  const lastPeriod = substring.lastIndexOf(".");
  const lastExcl = substring.lastIndexOf("!");
  const lastQuestion = substring.lastIndexOf("?");

  const lastSentenceEnd = Math.max(lastPeriod, lastExcl, lastQuestion);

  if (lastSentenceEnd > maxLength * 0.5) {
    // Cut at sentence boundary if it's past halfway
    return text.substring(0, lastSentenceEnd + 1).trim();
  }

  // Fallback: cut at last space and add ellipsis
  const lastSpace = substring.lastIndexOf(" ");
  if (lastSpace > 0) {
    return text.substring(0, lastSpace).trim() + "...";
  }

  return substring.trim() + "...";
}

/**
 * Calculate how many SMS segments a message will use
 */
export function countSMSSegments(text: string): number {
  const isUnicode = /[^\x00-\x7F]/.test(text);

  if (isUnicode) {
    if (text.length <= 70) return 1;
    return Math.ceil(text.length / 63);
  } else {
    if (text.length <= 160) return 1;
    return Math.ceil(text.length / 153);
  }
}
