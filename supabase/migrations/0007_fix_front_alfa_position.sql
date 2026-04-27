-- FRONT ALFA was seeded at 39.3°E which is inland Saudi Arabia.
-- Correct to 37.82°E — mid-Red Sea at that latitude, heading north toward Suez.
-- Only corrects if still at the bad seed value (AIS ingest may have already fixed it).
update public.vessels
set
  last_position_lon = 37.82,
  last_heading      = 345,
  updated_at        = now()
where id = '10000000-0000-0000-0000-000000000005'
  and last_position_lon between 39.0 and 40.0;
