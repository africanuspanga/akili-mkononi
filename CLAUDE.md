# AKILI MKONONI - Claude Code Instructions

## What is this?
An SMS-based AI assistant for Tanzania. Users text questions to a short code, we process via LLM, reply via SMS. No smartphone/internet needed.

## SMS Gateway: MobiShastra
- **Inbound (Pull API):** MobiShastra sends GET request to our webhook with params: `shortcode`, `mobileno`, `keyword`, `message`
- **Outbound (Push API):** We call `https://mshastra.com/sendurl.aspx` with params: `user`, `pwd`, `senderid`, `mobileno`, `msgtext`, `CountryCode=ALL`
- **Response codes:** "Send Successful" on success. Error codes: 000=success, 001=invalid receiver, 005=auth failed, etc.
- **SMS limits:** 160 chars = 1 SMS (English), 70 chars = 1 SMS (Unicode/Swahili with special chars). Multi-part: 153 chars/segment (English), 63 chars/segment (Unicode).

## Key Design Decisions
1. Keep responses under 459 characters (3 SMS segments max) to control costs
2. Detect Swahili vs English and reply in same language
3. Rate limit: max 1 query per 10 seconds per phone number
4. Free tier: 5 queries/day per phone number
5. Cache common questions to reduce LLM API costs
6. Use GPT-4o-mini for cost efficiency (~$0.15/1M input tokens)

## Environment Variables Required
- MOBISHASTRA_USER - Profile ID (8-digit numeric)
- MOBISHASTRA_PWD - Password
- MOBISHASTRA_SENDER_ID - Approved sender ID
- OPENAI_API_KEY - OpenAI API key
- NEXT_PUBLIC_SUPABASE_URL - Supabase project URL (optional for MVP)
- SUPABASE_SERVICE_ROLE_KEY - Supabase service key (optional for MVP)

## Testing
- Test webhook: `curl "http://localhost:3000/api/webhook/sms?shortcode=15500&mobileno=255712345678&keyword=AKILI&message=hello"`
- Test SMS send: The webhook handler will call MobiShastra Push API automatically
- For local dev, set `DRY_RUN=true` to skip actual SMS sending and log to console instead

## Important Notes
- MobiShastra uses GET requests (not POST) for their Push API
- Phone numbers should include country code (255 for Tanzania)
- The CountryCode param should be "ALL" to support Tanzania numbers
- URL-encode the msgtext parameter when sending
