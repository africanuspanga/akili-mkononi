/**
 * Simple heuristic-based Swahili detection
 * Checks for common Swahili words and patterns
 */

const SWAHILI_MARKERS = [
  // Common words
  "habari", "mambo", "nini", "vipi", "jinsi", "gani", "kwa",
  "ndiyo", "hapana", "ndio", "sawa", "asante", "tafadhali",
  "naomba", "nataka", "naweza", "ninaomba", "ninajua",
  // Question words
  "nini", "wapi", "lini", "kwa nini", "kiasi gani", "je",
  // Common verbs/prefixes
  "nina", "una", "ana", "tuna", "mna", "wana",
  "nita", "uta", "ata", "tuta", "mta", "wata",
  "nime", "ume", "ame", "tume", "mme", "wame",
  // Nouns & topics
  "dalili", "ugonjwa", "dawa", "hospitali", "shule",
  "kilimo", "mazao", "maji", "chakula", "biashara",
  "pesa", "kazi", "nyumba", "watoto", "familia",
  "serikali", "sheria", "elimu", "afya", "hali",
  // Connectors
  "ya", "wa", "na", "ni", "kwa", "katika", "au",
  "lakini", "pia", "hata", "kama", "ili", "kwamba",
  // Greetings
  "hujambo", "sijambo", "shikamoo", "marahaba",
  "karibu", "kwaheri", "pole", "hongera",
];

// Common Swahili two-letter prefixes that indicate Swahili sentence structure
const SWAHILI_PREFIXES = ["ni", "si", "ki", "vi", "mi", "wa", "ma"];

export function detectLanguage(text: string): "sw" | "en" {
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/);

  let swahiliScore = 0;
  const totalWords = words.length;

  for (const word of words) {
    // Direct match with known Swahili words
    if (SWAHILI_MARKERS.includes(word)) {
      swahiliScore += 2;
      continue;
    }

    // Check if word starts with common Swahili prefixes
    for (const prefix of SWAHILI_PREFIXES) {
      if (word.startsWith(prefix) && word.length > 3) {
        swahiliScore += 0.5;
        break;
      }
    }
  }

  // If more than 30% of words match Swahili patterns, classify as Swahili
  const threshold = totalWords * 0.3;
  return swahiliScore >= threshold && swahiliScore >= 1 ? "sw" : "en";
}
