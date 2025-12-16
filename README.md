# Study Buddy Edge

A full-stack language learning application entirely hosted on Supabase Edge Functions.

## Overview

This project provides interactive flashcard widgets for vocabulary study sessions, using:
- **Supabase Edge Functions** for the MCP server backend
- **Supabase PostgreSQL** for persistent deck storage
- **Supabase Auth** for OAuth 2.1 authentication
- **Static file bundling** for widget serving (no external CDN required)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    study-buddy/                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │ │
│  │  │  /mcp    │  │ /oauth/* │  │ /widgets/* (static)  │   │ │
│  │  │  (MCP)   │  │  (auth)  │  │  (JS/CSS bundles)    │   │ │
│  │  └──────────┘  └──────────┘  └──────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     Supabase PostgreSQL       │
              │   (decks table with RLS)      │
              └───────────────────────────────┘
```

## Project Structure

```
study-buddy-edge/
├── supabase/
│   ├── config.toml              # Supabase config with static_files
│   ├── migrations/              # Database migrations
│   └── functions/
│       └── study-buddy/         # Edge Function
│           ├── index.ts         # Hono entry point
│           ├── widgets/         # Built widget files
│           └── src/             # Server source code
├── web/                         # React widgets source
├── shared/                      # Shared types and schemas
├── scripts/
│   └── prepare.js              # Build script
└── package.json
```

## Prerequisites

- Node.js 24.11.1 (see `.nvmrc`)
- pnpm package manager
- Supabase CLI 2.7.0+ (required for static file bundling)
- Docker (required for deployment)

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Link to Supabase project**:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

3. **Set environment secrets**:
   ```bash
   supabase secrets set MCP_SERVER_URL=https://<project>.supabase.co/functions/v1/study-buddy
   supabase secrets set AUTH_PUBLIC_URL=https://<project>.supabase.co
   ```

4. **Apply database migrations**:
   ```bash
   supabase db push
   ```

## Development

**Build and prepare Edge Function**:
```bash
pnpm build
```

**Run locally**:
```bash
pnpm dev
```

**Deploy to Supabase**:
```bash
pnpm deploy
```

## MCP Tools & Widgets

### Tools
- **searchDeck**: Search saved decks by language, difficulty, or category
- **saveDeck**: Persist new flashcard decks to database

### Widgets
- **listDecks**: Display user's saved decks
- **startStudySessionFromDeck**: Study session with a saved deck
- **startStudySessionFromScratch**: Ad-hoc study session with custom flashcards

## Environment Variables

| Variable | Description | Auto-injected |
|----------|-------------|---------------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `MCP_SERVER_URL` | Public URL of Edge Function | No |
| `AUTH_PUBLIC_URL` | Public Supabase URL for OAuth | No |

## Static File Bundling

This project uses Supabase CLI 2.7.0's static file bundling feature to serve widgets directly from the Edge Function. The `static_files` config in `config.toml` bundles widget JS/CSS files, which are then served via `Deno.readFile()`.

## License

MIT
