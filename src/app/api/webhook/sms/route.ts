import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/mobishastra";
import { generateResponse } from "@/lib/llm";
import { detectLanguage } from "@/lib/language";
import { formatForSMS, countSMSSegments } from "@/lib/sms-formatter";
import { checkRateLimit, recordQuery } from "@/lib/store";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * MobiShastra Pull API Webhook
 * They send GET request with: shortcode, mobileno, keyword, message
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Extract params from MobiShastra webhook
  const searchParams = request.nextUrl.searchParams;
  const shortcode = searchParams.get("shortcode") || "";
  const mobileno = searchParams.get("mobileno") || "";
  const keyword = searchParams.get("keyword") || "";
  const message = searchParams.get("message") || "";

  // Optional shared-secret check — set WEBHOOK_SECRET to require ?secret=… on inbound URLs
  const requiredSecret = process.env.WEBHOOK_SECRET;
  if (requiredSecret) {
    const providedSecret = searchParams.get("secret") || "";
    if (providedSecret !== requiredSecret) {
      console.warn(`[Webhook] Unauthorized request from ${mobileno || "unknown"}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log(
    `[Webhook] Inbound SMS from ${mobileno}: "${message}" (keyword: ${keyword})`
  );

  // Validate required fields
  if (!mobileno || !message) {
    return NextResponse.json(
      { error: "Missing mobileno or message" },
      { status: 400 }
    );
  }

  // Check rate limits and daily quota.
  // Note: we silently drop rate-limited requests rather than send a notice SMS —
  // the user just got a reply seconds ago, and sending an SMS per rejected
  // request would be both costly and trivially weaponizable.
  const rateCheck = checkRateLimit(mobileno);
  if (!rateCheck.allowed) {
    console.log(`[Webhook] Rate limited: ${mobileno} - ${rateCheck.reason}`);
    return NextResponse.json({ status: "rate_limited", reason: rateCheck.reason });
  }

  // Record the attempt up front so abusive callers can't bypass quota by
  // forcing downstream failures (e.g. malformed payloads that crash the LLM).
  recordQuery(mobileno);

  try {
    // Detect language
    const language = detectLanguage(message);
    console.log(`[Webhook] Language detected: ${language}`);

    // Generate LLM response
    const llmResponse = await generateResponse(message, language);
    console.log(
      `[Webhook] LLM response (${llmResponse.tokens_used} tokens, $${llmResponse.cost_usd.toFixed(4)}, cached=${llmResponse.cached}): ${llmResponse.text.substring(0, 100)}...`
    );

    // Format for SMS
    const smsText = formatForSMS(llmResponse.text);
    const segments = countSMSSegments(smsText);
    console.log(
      `[Webhook] SMS formatted: ${smsText.length} chars, ${segments} segment(s)`
    );

    // Send reply SMS
    const sendResult = await sendSMS(mobileno, smsText);
    console.log(`[Webhook] SMS send result: ${sendResult.response}`);

    const latency = Date.now() - startTime;
    console.log(`[Webhook] Total latency: ${latency}ms`);

    return NextResponse.json({
      status: "success",
      phone: mobileno,
      question: message,
      language,
      response_length: smsText.length,
      sms_segments: segments,
      tokens_used: llmResponse.tokens_used,
      cost_usd: llmResponse.cost_usd,
      latency_ms: latency,
      sms_sent: sendResult.success,
    });
  } catch (error) {
    console.error("[Webhook] Error:", error);

    // Send error message to user
    const errorMsg =
      "Samahani, kuna tatizo. Jaribu tena. / Sorry, there was an error. Try again.";
    await sendSMS(mobileno, errorMsg);

    return NextResponse.json(
      { error: "Internal error", details: String(error) },
      { status: 500 }
    );
  }
}
