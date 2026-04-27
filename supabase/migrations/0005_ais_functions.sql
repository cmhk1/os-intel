-- Security-definer function so the anon key can upsert vessels from AIS lookups
-- without needing the service role key in the Next.js process.

create or replace function public.upsert_vessel_from_ais(
  p_mmsi      text,
  p_name      text,
  p_lat       numeric,
  p_lon       numeric,
  p_speed     numeric,
  p_heading   int,
  p_status    text,
  p_destination text default null,
  p_imo       text default null
)
returns table (
  id              uuid,
  mmsi            text,
  name            text,
  last_position_lat  numeric,
  last_position_lon  numeric,
  last_position_at   timestamptz,
  last_speed      numeric,
  last_heading    int,
  last_status     text,
  destination     text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.vessels (
    mmsi, name,
    last_position_lat, last_position_lon, last_position_at,
    last_speed, last_heading, last_status, destination, imo
  )
  values (
    p_mmsi, p_name,
    p_lat, p_lon, now(),
    p_speed, p_heading, p_status, p_destination,
    p_imo
  )
  on conflict (mmsi) do update set
    name             = coalesce(nullif(trim(excluded.name), ''), vessels.name),
    last_position_lat  = excluded.last_position_lat,
    last_position_lon  = excluded.last_position_lon,
    last_position_at   = now(),
    last_speed       = excluded.last_speed,
    last_heading     = excluded.last_heading,
    last_status      = excluded.last_status,
    destination      = coalesce(excluded.destination, vessels.destination),
    imo              = coalesce(excluded.imo, vessels.imo),
    updated_at       = now()
  returning vessels.id into v_id;

  -- Position history
  insert into public.vessel_positions (vessel_id, lat, lon, speed, heading, status, recorded_at, source)
  values (v_id, p_lat, p_lon, p_speed, p_heading, p_status, now(), 'aisstream');

  return query
    select
      v.id, v.mmsi, v.name,
      v.last_position_lat, v.last_position_lon, v.last_position_at,
      v.last_speed, v.last_heading, v.last_status, v.destination
    from public.vessels v
    where v.id = v_id;
end;
$$;

-- Allow the anon / authenticated roles to call this RPC
grant execute on function public.upsert_vessel_from_ais(
  text, text, numeric, numeric, numeric, int, text, text, text
) to anon, authenticated;
