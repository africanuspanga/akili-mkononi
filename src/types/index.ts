export interface SMSSendResult {
  success: boolean;
  response: string;
  error?: string;
}

export interface UserRecord {
  phone_number: string;
  daily_queries: number;
  total_queries: number;
  last_query_at: number;
  last_reset_date: string;
  created_at: string;
}
