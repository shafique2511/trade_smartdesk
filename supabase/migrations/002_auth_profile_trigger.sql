-- Trading SmartDesk Phase 3: create user profile after Supabase Auth signup.
-- This keeps profile creation reliable even when email confirmation is enabled.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    'trader',
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.user_profiles.full_name, excluded.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
