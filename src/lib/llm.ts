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
}

export async function generateResponse(
  question: string,
  language: "sw" | "en"
): Promise<LLMResponse> {
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

    return {
      text,
      tokens_used:
        (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0),
      cost_usd: inputCost + outputCost,
    };
  } catch (error) {
    console.error("[LLM] Error:", error);

    // Fallback response
    const fallback =
      language === "sw"
        ? "Samahani, kuna tatizo la kiufundi. Tafadhali jaribu tena baadaye."
        : "Sorry, there was a technical issue. Please try again later.";

    return { text: fallback, tokens_used: 0, cost_usd: 0 };
  }
}
