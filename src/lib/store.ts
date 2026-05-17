import { UserRecord } from "@/types";

/**
 * In-memory store for MVP
 * Replace with Supabase/Redis in production
 */

const users = new Map<string, UserRecord>();
const DAILY_FREE_LIMIT = 5;
const RATE_LIMIT_MS = 10_000; // 10 seconds between queries

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function getOrCreateUser(phoneNumber: string): UserRecord {
  let user = users.get(phoneNumber);

  if (!user) {
    user = {
      phone_number: phoneNumber,
      daily_queries: 0,
      total_queries: 0,
      last_query_at: 0,
      last_reset_date: getTodayDate(),
      created_at: new Date().toISOString(),
    };
    users.set(phoneNumber, user);
  }

  // Reset daily count if new day
  const today = getTodayDate();
  if (user.last_reset_date !== today) {
    user.daily_queries = 0;
    user.last_reset_date = today;
  }

  return user;
}

export function checkRateLimit(
  phoneNumber: string
): { allowed: boolean; reason?: string } {
  const user = getOrCreateUser(phoneNumber);
  const now = Date.now();

  // Check rate limit (10 seconds between queries)
  if (now - user.last_query_at < RATE_LIMIT_MS) {
    const waitSecs = Math.ceil((RATE_LIMIT_MS - (now - user.last_query_at)) / 1000);
    return {
      allowed: false,
      reason: `Subiri sekunde ${waitSecs} kabla ya swali lingine. / Wait ${waitSecs} seconds before next question.`,
    };
  }

  // Check daily limit
  if (user.daily_queries >= DAILY_FREE_LIMIT) {
    return {
      allowed: false,
      reason:
        "Umefika kikomo cha maswali 5 kwa siku. Tuma JISAJILI kupata maswali zaidi. / Daily limit of 5 free queries reached.",
    };
  }

  return { allowed: true };
}

export function recordQuery(phoneNumber: string): void {
  const user = getOrCreateUser(phoneNumber);
  user.daily_queries++;
  user.total_queries++;
  user.last_query_at = Date.now();
}

/**
 * Get stats for the admin dashboard
 */
export function getStats() {
  const allUsers = Array.from(users.values());
  return {
    total_users: allUsers.length,
    total_queries: allUsers.reduce((sum, u) => sum + u.total_queries, 0),
    active_today: allUsers.filter(
      (u) => u.last_reset_date === getTodayDate() && u.daily_queries > 0
    ).length,
  };
}
