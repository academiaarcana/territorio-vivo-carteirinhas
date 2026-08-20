-- Território Vivo — captura nome e microárea informados no cadastro.
-- O papel admin continua reservado ao e-mail master.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_microarea text;
begin
  requested_microarea := new.raw_user_meta_data->>'microarea';

  insert into public.profiles (id, full_name, role, microarea)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    case when lower(coalesce(new.email,'')) = 'macedotaynara@outlook.com' then 'admin' else 'acs' end,
    case when requested_microarea in ('08','09','10') then requested_microarea else null end
  )
  on conflict (id) do update
    set role = excluded.role,
        full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
        microarea = coalesce(public.profiles.microarea, excluded.microarea);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;
