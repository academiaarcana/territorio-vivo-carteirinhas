-- Garante no banco que somente a conta master possa ter papel admin.

create or replace function public.enforce_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_email text;
begin
  select lower(coalesce(email,'')) into account_email
  from auth.users
  where id = new.id;

  if account_email = 'macedotaynara@outlook.com' then
    new.role := 'admin';
  else
    new.role := 'acs';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_role() from public;
revoke execute on function public.enforce_profile_role() from anon, authenticated;

drop trigger if exists profiles_enforce_role on public.profiles;
create trigger profiles_enforce_role
before insert or update of role, id on public.profiles
for each row execute procedure public.enforce_profile_role();
