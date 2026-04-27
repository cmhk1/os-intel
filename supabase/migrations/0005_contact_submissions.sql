create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.contact_submissions enable row level security;

-- Allow anonymous inserts (public contact form)
create policy "anyone can submit contact form"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);
