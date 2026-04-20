-- =============================================================================
-- OS-INTEL :: Supabase schema
-- CTRM/ETRM on steroids with settlement-event instrumentation
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =============================================================================
-- ORGANIZATIONS & USERS
-- =============================================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  email text not null,
  full_name text,
  role text default 'member' check (role in ('admin','trader','ops','viewer','member')),
  created_at timestamptz default now()
);

-- =============================================================================
-- COUNTERPARTIES
-- =============================================================================

create table public.counterparties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  type text check (type in ('buyer','seller','bank','surveyor','broker','agent','insurer','other')),
  country text,
  lei text,
  tax_id text,
  risk_score int check (risk_score between 0 and 100),
  sanctions_status text default 'clear' check (sanctions_status in ('clear','flagged','sanctioned','pending')),
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.counterparties (org_id);
create index on public.counterparties using gin (name gin_trgm_ops);

-- =============================================================================
-- VESSELS (AIS-tracked ships)
-- =============================================================================

create table public.vessels (
  id uuid primary key default gen_random_uuid(),
  imo text unique,
  mmsi text,
  name text not null,
  type text,
  flag text,
  dwt int,
  built int,
  operator text,
  owner text,
  last_position_lat numeric(10,6),
  last_position_lon numeric(10,6),
  last_position_at timestamptz,
  last_speed numeric(5,2),
  last_heading int,
  last_status text,
  destination text,
  eta timestamptz,
  ais_gaps_24h int default 0,
  risk_flags jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.vessels (imo);
create index on public.vessels (mmsi);

-- AIS history (for replay, deviation detection)
create table public.vessel_positions (
  id bigserial primary key,
  vessel_id uuid references public.vessels(id) on delete cascade,
  lat numeric(10,6) not null,
  lon numeric(10,6) not null,
  speed numeric(5,2),
  heading int,
  status text,
  recorded_at timestamptz not null,
  source text default 'manual',
  raw jsonb
);
create index on public.vessel_positions (vessel_id, recorded_at desc);

-- =============================================================================
-- DEALS / TRADES (the core entity)
-- =============================================================================

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  deal_ref text not null,
  status text default 'draft' check (status in ('draft','contracted','loading','in_transit','discharged','settled','cancelled','disputed')),

  -- Commercial terms
  commodity text not null,
  grade text,
  quantity numeric(18,4),
  unit text default 'MT',
  price numeric(18,4),
  currency text default 'USD',
  price_mechanism text,
  incoterm text check (incoterm in ('FOB','CIF','CFR','DAP','DDP','EXW','FCA','CPT','CIP','FAS','DPU')),

  -- Parties
  buyer_id uuid references public.counterparties(id),
  seller_id uuid references public.counterparties(id),
  bank_id uuid references public.counterparties(id),
  surveyor_id uuid references public.counterparties(id),

  -- Logistics
  vessel_id uuid references public.vessels(id),
  load_port text,
  discharge_port text,
  laycan_start date,
  laycan_end date,
  etd date,
  eta date,

  -- Financial
  payment_terms text,
  lc_number text,
  lc_issue_date date,
  lc_expiry date,

  -- AI scoring
  ai_risk_score int check (ai_risk_score between 0 and 100),
  ai_flags jsonb default '[]',
  ai_summary text,

  notes text,
  metadata jsonb default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (org_id, deal_ref)
);
create index on public.deals (org_id, status);
create index on public.deals (vessel_id);
create index on public.deals (buyer_id);
create index on public.deals (seller_id);

-- =============================================================================
-- DOCUMENTS (B/L, LC, invoices, COAs, SGS, customs, etc.)
-- =============================================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  doc_type text not null check (doc_type in (
    'bill_of_lading','letter_of_credit','commercial_invoice','packing_list',
    'certificate_of_origin','coa','inspection_report','sgs_report','insurance',
    'customs_declaration','clearance','charter_party','statement_of_facts','other'
  )),
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,

  -- Parsed data
  parse_status text default 'pending' check (parse_status in ('pending','parsing','parsed','failed')),
  parsed_data jsonb default '{}',
  parsed_at timestamptz,

  -- AI validation
  validation_status text default 'unchecked' check (validation_status in ('unchecked','clean','warning','error')),
  validation_findings jsonb default '[]',

  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz default now()
);
create index on public.documents (deal_id);
create index on public.documents (doc_type);
create index on public.documents (validation_status);

-- =============================================================================
-- EVENTS (the settlement-event ledger — the moat)
-- Every observation about a deal is an event. Triggers fire on events.
-- =============================================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  event_type text not null,
  source text not null check (source in ('manual','ais','document','ai','api','trigger','system')),
  source_ref uuid,
  payload jsonb default '{}',
  severity text default 'info' check (severity in ('info','warn','error','critical')),
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);
create index on public.events (deal_id, occurred_at desc);
create index on public.events (event_type);

-- =============================================================================
-- TRIGGERS (rule-based release / flagging logic)
-- =============================================================================

create table public.triggers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  name text not null,
  description text,
  conditions jsonb not null default '{}',
  action text not null check (action in ('notify','flag','release_milestone','block','request_doc','escalate')),
  action_payload jsonb default '{}',
  status text default 'armed' check (status in ('armed','fired','disarmed','failed')),
  fired_at timestamptz,
  fired_event_id uuid references public.events(id),
  created_at timestamptz default now()
);
create index on public.triggers (deal_id, status);

-- =============================================================================
-- LENDING (simple first version — pull factor for SMBs)
-- =============================================================================

create table public.lending_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  amount numeric(18,2) not null,
  currency text default 'USD',
  tenor_days int,
  purpose text,
  status text default 'open' check (status in ('open','under_review','quoted','accepted','rejected','funded','repaid','cancelled')),
  created_at timestamptz default now()
);

create table public.lending_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.lending_requests(id) on delete cascade,
  lender_id uuid references public.counterparties(id),
  rate_bps int,
  advance_rate_pct numeric(5,2),
  terms text,
  status text default 'proposed' check (status in ('proposed','accepted','withdrawn','expired')),
  created_at timestamptz default now()
);

-- =============================================================================
-- AI CONVERSATIONS (copilot context)
-- =============================================================================

create table public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text,
  created_at timestamptz default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.ai_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text,
  tool_calls jsonb,
  created_at timestamptz default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.counterparties enable row level security;
alter table public.vessels enable row level security;
alter table public.vessel_positions enable row level security;
alter table public.deals enable row level security;
alter table public.documents enable row level security;
alter table public.events enable row level security;
alter table public.triggers enable row level security;
alter table public.lending_requests enable row level security;
alter table public.lending_offers enable row level security;
alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;

-- Helper: which org is the current user in
create or replace function public.current_org_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid() limit 1;
$$;

-- Profiles: user can see/update own profile
create policy "profiles_self_read" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_org_read" on public.profiles for select using (org_id = public.current_org_id());

-- Organizations: members read
create policy "orgs_read" on public.organizations for select using (id = public.current_org_id());

-- Generic policy pattern: scope everything to current org
create policy "counterparties_rw" on public.counterparties for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "deals_rw" on public.deals for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "documents_rw" on public.documents for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "events_rw" on public.events for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "triggers_rw" on public.triggers for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "lending_requests_rw" on public.lending_requests for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "lending_offers_rw" on public.lending_offers for all using (exists (select 1 from public.lending_requests r where r.id = request_id and r.org_id = public.current_org_id()));
create policy "ai_threads_rw" on public.ai_threads for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "ai_messages_rw" on public.ai_messages for all using (exists (select 1 from public.ai_threads t where t.id = thread_id and t.org_id = public.current_org_id()));

-- Vessels and positions are globally readable (public AIS data)
create policy "vessels_read_all" on public.vessels for select using (true);
create policy "vessels_write_auth" on public.vessels for insert with check (auth.uid() is not null);
create policy "vessels_update_auth" on public.vessels for update using (auth.uid() is not null);
create policy "vessel_positions_read_all" on public.vessel_positions for select using (true);
create policy "vessel_positions_write_auth" on public.vessel_positions for insert with check (auth.uid() is not null);

-- =============================================================================
-- TRIGGERS (DB-level): auto-create profile, updated_at, event emission
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger deals_touch before update on public.deals for each row execute function public.touch_updated_at();
create trigger counterparties_touch before update on public.counterparties for each row execute function public.touch_updated_at();
create trigger vessels_touch before update on public.vessels for each row execute function public.touch_updated_at();

-- Emit event when a deal changes status
create or replace function public.emit_deal_status_event()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.events (org_id, deal_id, event_type, source, payload, severity)
    values (new.org_id, new.id, 'deal.status_changed', 'system',
            jsonb_build_object('from', old.status, 'to', new.status), 'info');
  end if;
  return new;
end;
$$;
create trigger deals_emit_status after update on public.deals
  for each row execute function public.emit_deal_status_event();

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_read_own_org" on storage.objects for select
  using (bucket_id = 'documents' and (auth.uid() is not null));
create policy "documents_upload_auth" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid() is not null);
create policy "documents_update_auth" on storage.objects for update
  using (bucket_id = 'documents' and auth.uid() is not null);
create policy "documents_delete_auth" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid() is not null);
