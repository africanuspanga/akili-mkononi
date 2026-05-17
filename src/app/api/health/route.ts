import { NextResponse } from "next/server";
import { checkBalance } from "@/lib/mobishastra";
import { getStats } from "@/lib/store";

export async function GET() {
  const stats = getStats();
  const dryRun = process.env.DRY_RUN === "true";

  let smsBalance: string | null = null;
  if (!dryRun && process.env.MOBISHASTRA_USER && process.env.MOBISHASTRA_PWD) {
    smsBalance = await checkBalance();
  }

  return NextResponse.json({
    status: "ok",
    dry_run: dryRun,
    timestamp: new Date().toISOString(),
    sms_balance: smsBalance,
    stats,
    env: {
      openai_configured: !!process.env.OPENAI_API_KEY,
      mobishastra_configured: !!(
        process.env.MOBISHASTRA_USER && process.env.MOBISHASTRA_PWD
      ),
    },
  });
}
