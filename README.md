# OS Intel

Commodity trade intelligence platform for oil & energy desks. Tracks vessel positions via live AIS, manages deals and counterparties, and surfaces compliance exceptions — all in a Bloomberg terminal-inspired UI.

**Live:** [os-intel.vercel.app](https://os-intel.vercel.app)

---

## What's been built (v0.1)

### Map
- Globe projection with live vessel markers (GeoJSON layers — GPU-rendered, no drift at any zoom)
- Directional arrowheads rotated by vessel heading
- Glow effect: amber = in transit, blue = loading, green = arrived, red = AIS exception
- Click any vessel to open a trade detail slide-over (cargo, counterparties, agent activity)
- Realtime position updates via Supabase postgres_changes subscription
- Vessels added or removed instantly reflect on the map without a page reload

### Vessel tracking
- **Cmd+K** anywhere in the app opens a vessel lookup modal
- Type any 9-digit MMSI → connects to AISStream WebSocket → vessel appears on map and in the Vessels tab
- Vessels tab shows all tracked vessels: status, speed, destination, last seen
- **Remove** button (two-click confirm) deletes a vessel from tracking and removes its map marker in realtime

### AIS ingest
- Supabase Edge Function (`ais-ingest`) connects to AISStream WebSocket
- GitHub Actions cron triggers it every 5 minutes, updating positions for all tracked vessels
- Supports both cron mode (all vessels) and single-MMSI lookup mode (Cmd+K)
- Handles new vessels not yet in the DB via `upsert_vessel_from_ais` RPC

### Infrastructure
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase PostgreSQL + Realtime + Edge Functions
- Deployed on Vercel (continuous deployment from `main`)
- AISStream API key lives only in Supabase secrets — never in Next.js env

---

## Setup

### Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Supabase

Run migrations in order via the Supabase SQL editor:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_seed.sql
supabase/migrations/0003_ais_ingest.sql
supabase/migrations/0004_upsert_vessel.sql
supabase/migrations/0005_ais_functions.sql
supabase/migrations/0006_vessel_delete.sql
supabase/migrations/0007_fix_front_alfa_position.sql
```

### Edge function

Deploy via Supabase CLI:

```bash
supabase functions deploy ais-ingest
```

Set the secret in Supabase dashboard → Edge Functions → ais-ingest → Secrets:

```
AISSTREAM_API_KEY=your_aisstream_key
```

### GitHub Actions (AIS cron)

Add these secrets to your GitHub repo (Settings → Secrets):

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Next patches / to-dos

### AIS & vessel tracking
- [ ] Fix Cmd+K lookup for vessels not currently broadcasting (return DB record if already tracked, only hit AISStream for new ones)
- [ ] AIS gap tracking — replace the removed inline counter with a scheduled Postgres function that increments `ais_gaps_24h` for vessels that haven't updated in 6+ hours
- [ ] Show vessel trail (last N positions from `vessel_positions` table) on map click
- [ ] Vessel type icons — differentiate tankers, LNG carriers, product tankers visually

### Deals & inbox
- [ ] Wire up the Inbox tab to real deal events (currently UI-only)
- [ ] Deal detail page — full lifecycle timeline, document checklist, counterparty risk
- [ ] Document upload (B/L, LC, inspection reports) with AI extraction

### Compliance
- [ ] Sanctions screening on counterparty add — check against OFAC/EU lists
- [ ] AIS exception alerting — push notification or email when a tracked vessel goes dark

### Map
- [ ] Vessel trail lines from `vessel_positions` history
- [ ] Port labels and anchorage zones overlay
- [ ] Filter panel — filter map by status, cargo type, counterparty

### Infrastructure
- [ ] Auth — re-enable Supabase Auth with org-based access (schema is already in place)
- [ ] Role-based permissions (trader view vs compliance view vs read-only)
- [ ] Supabase CLI migration workflow — currently all migrations run manually via SQL editor
