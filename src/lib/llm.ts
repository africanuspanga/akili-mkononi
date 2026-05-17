import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT_SW = `Wewe ni AKILI MKONONI, msaidizi wa SMS kwa Watanzania.

Kanuni:
- Jibu kwa Kiswahili
- Jibu liwe chini ya herufi 400
- Kuwa na msaada wa moja kwa moja na wa vitendo
- Tumia lugha rahisi inayoeleweka kwa kila mtu
- Kwa maswali ya afya, shauri kwenda hospitali daima
- Kwa dharura, toa nambari za dharura (112, 114)
- Usitoe ushauri wa kisheria, kifedha, au kimatibabu
- Majibu yawe yanafaa kwa mazingira ya Tanzania`;

const SYSTEM_PROMPT_EN = `You are AKILI MKONONI, an SMS assistant for Tanzanians.

Rules:
- Reply in English
- Keep response under 400 characters
- Be direct and practical
- Use simple language accessible to all education levels
- For health queries, always advise visiting a doctor
- For emergencies, provide emergency numbers (112, 114)
- Never provide financial, legal, or medical advice as definitive
- Answers should be locally relevant to Tanzania`;

export interface LLMResponse {
  text: string;
  tokens_used: number;
  cost_usd: number;
  cached: boolean;
}

// In-memory response cache keyed by `${lang}::${normalized_question}`.
// Won't survive Vercel cold starts, but warm-instance repeats of common
// questions (e.g. "what is the capital of tanzania") are served for free.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 1000;
const cache = new Map<string, { text: string; expires_at: number }>();

function cacheKey(question: string, language: "sw" | "en"): string {
  return `${language}::${question.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

function cacheGet(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires_at) {
    cache.delete(key);
    return null;
  }
  return entry.text;
}

function cacheSet(key: string, text: string): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { text, expires_at: Date.now() + CACHE_TTL_MS });
}

export async function generateResponse(
  question: string,
  language: "sw" | "en"
): Promise<LLMResponse> {
  const key = cacheKey(question, language);
  const cachedText = cacheGet(key);
  if (cachedText) {
    return { text: cachedText, tokens_used: 0, cost_usd: 0, cached: true };
  }

  const systemPrompt =
    language === "sw" ? SYSTEM_PROMPT_SW : SYSTEM_PROMPT_EN;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_tokens: 200, // Keep responses short for SMS
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || "";
    const usage = completion.usage;

    // GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
    const inputCost = ((usage?.prompt_tokens || 0) / 1_000_000) * 0.15;
    const outputCost = ((usage?.completion_tokens || 0) / 1_000_000) * 0.6;

    if (text) cacheSet(key, text);

    return {
      text,
      tokens_used:
        (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0),
      cost_usd: inputCost + outputCost,
      cached: false,
    };
  } catch (error) {
    console.error("[LLM] Error:", error);

    // Fallback response
    const fallback =
      language === "sw"
        ? "Samahani, kuna tatizo la kiufundi. Tafadhali jaribu tena baadaye."
        : "Sorry, there was a technical issue. Please try again later.";

    return { text: fallback, tokens_used: 0, cost_usd: 0, cached: false };
  }
}
