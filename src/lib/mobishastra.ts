import { SMSSendResult } from "@/types";

const MOBISHASTRA_BASE = "https://mshastra.com/sendurl.aspx";

/**
 * Send an SMS via MobiShastra Push API
 * Uses their single-number endpoint (sendurl.aspx)
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SMSSendResult> {
  const user = process.env.MOBISHASTRA_USER;
  const pwd = process.env.MOBISHASTRA_PWD;
  const senderId = process.env.MOBISHASTRA_SENDER_ID || "AKILI";

  if (!user || !pwd) {
    return {
      success: false,
      response: "",
      error: "MobiShastra credentials not configured",
    };
  }

  // Dry run mode for testing
  if (process.env.DRY_RUN === "true") {
    console.log(`[DRY RUN] SMS to ${phoneNumber}: ${message}`);
    return { success: true, response: "DRY_RUN: Send Successful" };
  }

  // Normalize phone number - ensure it has country code
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Build the URL with query params (MobiShastra uses GET requests)
  const params = new URLSearchParams({
    user,
    pwd,
    senderid: senderId,
    mobileno: normalizedPhone,
    msgtext: message,
    CountryCode: "ALL",
  });

  const url = `${MOBISHASTRA_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const responseText = await response.text();

    const success =
      responseText.includes("Send Successful") ||
      responseText.startsWith("000");

    if (!success) {
      console.error(`[MobiShastra] SMS send failed: ${responseText}`);
    }

    return {
      success,
      response: responseText,
      error: success ? undefined : responseText,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[MobiShastra] Network error: ${errMsg}`);
    return { success: false, response: "", error: errMsg };
  }
}

/**
 * Check MobiShastra account balance
 */
export async function checkBalance(): Promise<string> {
  const user = process.env.MOBISHASTRA_USER;
  const pwd = process.env.MOBISHASTRA_PWD;

  if (!user || !pwd) return "Credentials not configured";

  try {
    const url = `https://mshastra.com/balance.aspx?user=${user}&pwd=${pwd}`;
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : "Unknown"}`;
  }
}

/**
 * Normalize Tanzanian phone numbers to include country code
 * Handles: 0712345678, 712345678, 255712345678, +255712345678
 */
function normalizePhoneNumber(phone: string): string {
  // Remove spaces, dashes, and plus sign
  let cleaned = phone.replace(/[\s\-\+]/g, "");

  // If starts with 0, replace with 255
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "255" + cleaned.slice(1);
  }

  // If 9 digits (no leading 0 or country code), add 255
  if (cleaned.length === 9 && !cleaned.startsWith("255")) {
    cleaned = "255" + cleaned;
  }

  return cleaned;
}
