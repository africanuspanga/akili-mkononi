/**
 * Format LLM response for SMS delivery.
 * 3-segment budgets: 459 chars (GSM-7) or 189 chars (Unicode UCS-2).
 * We target a slight buffer below each so concatenation overhead is safe.
 */

const MAX_GSM_LENGTH = 450;
const MAX_UNICODE_LENGTH = 180;

// "•" (U+2022) is NOT in the GSM-7 alphabet — substituting it for "- " would
// force the whole reply into Unicode encoding (153 → 63 chars/segment), more
// than doubling the SMS cost. Use plain "* " instead, which is GSM-safe.
const BULLET = "* ";

export function formatForSMS(text: string): string {
  const cleaned = text
    .replace(/\*\*/g, "") // bold
    .replace(/(?<!\*)\*(?!\*)/g, "") // single italic asterisks (preserves our bullet sentinel below)
    .replace(/#{1,6}\s/g, "") // headers
    .replace(/`{1,3}/g, "") // code blocks
    .replace(/\n{3,}/g, "\n\n") // excessive newlines
    .replace(/^- /gm, BULLET) // markdown bullets → GSM-safe bullet
    .trim();

  const maxLength = /[^\x00-\x7F]/.test(cleaned)
    ? MAX_UNICODE_LENGTH
    : MAX_GSM_LENGTH;

  if (cleaned.length <= maxLength) return cleaned;
  return truncateAtSentence(cleaned, maxLength);
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
