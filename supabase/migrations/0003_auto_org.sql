-- Ensure the demo org exists
insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Demo Trading Co.', 'demo-trading')
on conflict (id) do nothing;

-- Update handle_new_user to auto-assign the demo org
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, org_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    '00000000-0000-0000-0000-000000000001'
  )
  on conflict (id) do update
    set org_id = coalesce(profiles.org_id, excluded.org_id);
  return new;
end;
$$;

-- Re-assign any existing profiles that have no org
update public.profiles
set org_id = '00000000-0000-0000-0000-000000000001'
where org_id is null;
