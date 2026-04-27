-- Allow anon key to delete a vessel (cascade handles vessel_positions via FK).
create or replace function public.delete_vessel(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.vessels where id = p_id;
end;
$$;

grant execute on function public.delete_vessel(uuid) to anon, authenticated;
