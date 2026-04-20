# OS-Intel

**Programmable trade operations cockpit.**
CTRM on steroids — deals, documents, AIS, triggers, AI, settlement.

Built for commodity operators. Next.js 14 + Supabase + Anthropic Claude.

> This is the SMB pull-factor layer of the Mentriva stack. The flows traders
> run here become labeled settlement events — the training data for the real
> moat.

---

## What's in here

- **CTRM core**: deals, counterparties, vessels, documents, events
- **AIS-ready**: vessel registry + position history, hooks for MarineTraffic / Datalastic / AISHub
- **Document pipeline**: upload → storage → AI parse → validation findings
- **Programmable triggers**: event-driven rule engine (the bridge to settlement)
- **AI Copilot**: deal-aware assistant grounded in live Supabase data
- **Lending space**: surface for SMB trade finance requests

Aesthetic: Bloomberg Terminal × Linear. Dark, dense, monospace numbers, amber accent. Built for operators who read screens for 12 hours.

---

## Stack

| Layer       | Tech                                                  |
| ----------- | ----------------------------------------------------- |
| Frontend    | Next.js 14 (App Router), React 18, TypeScript         |
| Styling     | Tailwind CSS + custom design tokens, Lucide icons     |
| Database    | Supabase (Postgres + Auth + Storage + Realtime + RLS) |
| AI          | Anthropic Claude Sonnet 4.5 via `@anthropic-ai/sdk`   |
| Hosting     | Vercel (zero-config)                                  |
| Typography  | Instrument Serif (display) · JetBrains Mono · Inter   |

---

## 5-minute deployment

You'll need: a Supabase account, a Vercel account, and an Anthropic API key.

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name: `os-intel` · pick region closest to you · set a DB password
3. Wait ~1 min for provisioning

### 2. Run the SQL migrations

In the Supabase dashboard → **SQL Editor** → **New query**:

1. Paste the contents of `supabase/migrations/0001_init.sql` → **Run**
2. New query → paste `supabase/migrations/0002_seed.sql` → **Run**

This creates all tables, RLS policies, the storage bucket, and realistic oil & energy seed data (5 VLCCs with real IMOs, Vitol/Trafigura/Aramco counterparties, 5 deals including a live quality dispute).

### 3. Enable email auth

Supabase dashboard → **Authentication** → **Providers** → **Email**:
- Enable email provider
- For fast local dev: **disable** "Confirm email" so you can log in immediately after signup
- (Re-enable it when you go to production)

### 4. Grab your Supabase keys

**Settings** → **API**:
- Copy `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon` / `public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Get an Anthropic API key

Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → create a key (starts with `sk-ant-`). This powers the Copilot.

### 6. Deploy to Vercel

**Easiest path — GitHub then Vercel:**

```bash
cd os-intel
git init
git add .
git commit -m "init: os-intel"
# Create an empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/os-intel.git
git branch -M main
git push -u origin main
```

Then on Vercel:

1. **New Project** → Import the `os-intel` repo
2. Framework preset: **Next.js** (auto-detected)
3. **Environment Variables** — add these three:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
4. Click **Deploy**

~2 minutes later you have a live URL.

**Alternative — Vercel CLI:**

```bash
npm i -g vercel
vercel
# answers: set project name to os-intel, link to your account
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

### 7. First run

1. Visit your deployed URL → **Request access**
2. Create an account with email + password
3. The DB trigger auto-creates your profile AND attaches you to the demo org (so you immediately see all the seed data)
4. You're in the terminal. Open any deal to try the Copilot.

> If you sign up and see no deals: go to Supabase → SQL Editor and run:
> `update profiles set org_id = '00000000-0000-0000-0000-000000000001' where org_id is null;`

---

## Running locally

```bash
cp .env.example .env.local
# fill in your keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
os-intel/
├── src/
│   ├── app/
│   │   ├── (dashboard)/         # auth-gated routes
│   │   │   ├── layout.tsx       # sidebar + topbar
│   │   │   ├── dashboard/       # overview
│   │   │   ├── deals/           # list + [id] + new
│   │   │   ├── vessels/
│   │   │   ├── documents/
│   │   │   ├── counterparties/
│   │   │   ├── triggers/
│   │   │   ├── lending/
│   │   │   └── copilot/
│   │   ├── api/
│   │   │   ├── copilot/         # Claude-powered deal copilot
│   │   │   └── parse-document/  # doc validation
│   │   ├── login/
│   │   ├── signup/
│   │   ├── page.tsx             # landing
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/              # DealCopilot, DocumentUpload, etc.
│   ├── lib/
│   │   ├── supabase/            # browser + server clients
│   │   └── utils.ts             # formatters
│   └── middleware.ts            # auth gate
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql        # schema + RLS + storage
│       └── 0002_seed.sql        # realistic oil & energy data
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## The data model (why it matters)

The schema is designed so that every observable about a deal becomes a first-class `event`. Triggers fire on events. Eventually, settlement releases are also events. This means every deal flow produces a **labeled settlement event graph** — the proprietary dataset that's the whole thesis.

Key tables:

| Table               | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `deals`             | The trade. Commercial terms + parties + logistics + AI.   |
| `counterparties`    | Buyers, sellers, banks, surveyors. Risk-scored.           |
| `vessels`           | AIS-tracked ships with last position and risk flags.      |
| `vessel_positions`  | Historical AIS for replay + deviation detection.          |
| `documents`         | B/L, LC, invoices, COAs. Parsed and validated.            |
| `events`            | **Everything that happens** to a deal. The ledger.        |
| `triggers`          | Rules that fire on events. Programmable.                  |
| `lending_requests`  | SMB financing asks — the pull-factor surface.             |
| `ai_threads`        | Copilot conversation history per deal.                    |

Row-level security: every row scoped to the user's org. Vessels are globally readable (AIS is not proprietary).

---

## Extending

### Plug in a real AIS feed

Replace the stub in `/src/app/api/` by adding an `/api/ais/refresh` route that:
1. Calls MarineTraffic / Datalastic / AISHub for vessel positions
2. Upserts into `vessels` (update `last_position_*`) and inserts into `vessel_positions`
3. Detects AIS gaps, emits events of type `vessel.ais_gap`
4. Schedule with Vercel Cron

### Make document parsing real

`/api/parse-document` is currently a stub. Replace with:
1. Fetch the file from Supabase Storage
2. Send to Claude Vision (PDFs and images both supported) with a structured extraction prompt
3. Store results in `documents.parsed_data`
4. Cross-check against the deal (vessel name, quantities, dates, ports) and write findings

### Build the trigger engine

Current triggers are display-only. A real engine:
1. Subscribes to `events` via Supabase Realtime
2. On each event, evaluates armed triggers whose `conditions` match
3. Fires the action (`notify`, `flag`, `release_milestone`, `block`, etc.)
4. For `release_milestone`: calls the Mentriva settlement rail

### Connect to Mentriva rails

The `triggers.action = 'release_milestone'` path is the bridge. When fired, POST to the Mentriva settlement API with the event payload as oracle input. The ledger records both the event and the resulting transfer — which is how you close the proprietary-data loop.

---

## Security notes for production

- **Turn email confirmation back on** in Supabase Auth
- Replace the dev-only auto-attach-to-demo-org in `0002_seed.sql` with proper org invite flow
- Restrict `vessels` write policy (currently `auth.uid() is not null` — tighten to service role when you have a real AIS ingest worker)
- Add rate limiting on `/api/copilot` (Anthropic calls cost money)
- Consider per-org Anthropic keys for cost attribution at scale

---

## License

Proprietary. Mentriva.

---

**Built with Claude.**
