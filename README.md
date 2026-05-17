# AKILI MKONONI - SMS-Powered AI Assistant

## Project Overview
Connecting 30+ million Tanzanian feature phone users to AI via SMS.

## Architecture
```
User SMS → MobiShastra (Pull API webhook) → Next.js API → OpenAI → MobiShastra (Push API) → User receives answer
```

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + RLS)
- **LLM:** OpenAI GPT-4o-mini (primary), Claude as fallback
- **SMS Gateway:** MobiShastra Technologies
- **Payments:** Selcom (M-Pesa) - Phase 2
- **Cache:** In-memory Map (MVP), upgrade to Upstash Redis later
- **Hosting:** Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your credentials

# Run development server
npm run dev

# Test the webhook locally
curl -X GET "http://localhost:3000/api/webhook/sms?shortcode=15500&mobileno=255712345678&keyword=AKILI&message=What+is+the+capital+of+Tanzania"
```

## Environment Variables
```
MOBISHASTRA_USER=DRIFTMARK
MOBISHASTRA_PWD=your_password_here
MOBISHASTRA_SENDER_ID=AKILI
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## API Endpoints
- `GET /api/webhook/sms` - MobiShastra Pull API webhook (receives inbound SMS)
- `GET /api/health` - Health check
- `GET /api/stats` - Query statistics (protected)

## SMS Flow
1. User texts question to short code
2. MobiShastra forwards to our webhook with `shortcode`, `mobileno`, `keyword`, `message`
3. We detect language, check rate limits, query LLM
4. Response optimized for SMS (max 459 chars / 3 segments)
5. Reply sent via MobiShastra Push API (`sendurl.aspx`)
6. Query logged for analytics

## Project Structure
```
akili-mkononi/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhook/sms/route.ts    # Inbound SMS webhook
│   │   │   ├── health/route.ts          # Health check
│   │   │   └── stats/route.ts           # Analytics
│   │   ├── layout.tsx
│   │   └── page.tsx                     # Admin dashboard
│   ├── lib/
│   │   ├── mobishastra.ts              # SMS gateway client
│   │   ├── llm.ts                       # LLM integration
│   │   ├── language.ts                  # Language detection
│   │   ├── rate-limiter.ts             # Rate limiting
│   │   ├── sms-formatter.ts            # Response optimization
│   │   └── store.ts                     # In-memory store (MVP)
│   └── types/
│       └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.js
└── CLAUDE.md                           # Instructions for Claude Code
```
