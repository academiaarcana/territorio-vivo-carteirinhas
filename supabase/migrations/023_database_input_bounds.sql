-- Território Vivo — limites de entrada no banco.
-- O navegador já possui maxlength/validação, mas chamadas diretas à API também
-- precisam respeitar limites previsíveis e coordenadas completas.

alter table public.profiles
  drop constraint if exists profiles_text_lengths_check,
  add constraint profiles_text_lengths_check check (
    char_length(full_name) <= 160
    and char_length(coalesce(microarea,'')) <= 40
    and char_length(coalesce(acs_phone,'')) <= 80
    and char_length(unit_name) <= 180
    and char_length(team_name) <= 120
    and char_length(coalesce(unit_phone,'')) <= 80
    and char_length(coalesce(unit_address,'')) <= 240
    and char_length(coalesce(unit_hours,'')) <= 160
    and char_length(coalesce(doctor_name,'')) <= 160
    and char_length(coalesce(nurse_name,'')) <= 160
    and char_length(coalesce(tech_name,'')) <= 160
  );

alter table public.municipalities
  drop constraint if exists municipalities_text_lengths_check,
  add constraint municipalities_text_lengths_check check (
    char_length(code) <= 20
    and char_length(name) <= 160
  );

alter table public.health_units
  drop constraint if exists health_units_text_lengths_check,
  add constraint health_units_text_lengths_check check (
    char_length(cnes) <= 20
    and char_length(name) <= 180
    and char_length(short_name) <= 140
    and char_length(unit_type) <= 40
    and char_length(coalesce(address,'')) <= 240
    and char_length(coalesce(neighborhood,'')) <= 140
    and char_length(coalesce(phone,'')) <= 80
    and char_length(coalesce(hours,'')) <= 160
    and char_length(municipality) <= 160
    and char_length(state) <= 2
    and char_length(coalesce(source_url,'')) <= 1000
    and char_length(source_label) <= 180
    and char_length(coalesce(source_note,'')) <= 2000
  );

alter table public.teams
  drop constraint if exists teams_text_lengths_check,
  add constraint teams_text_lengths_check check (
    char_length(name) <= 120
    and char_length(coalesce(ine,'')) <= 30
    and char_length(coalesce(source_label,'')) <= 180
    and char_length(coalesce(source_url,'')) <= 1000
    and char_length(coalesce(source_note,'')) <= 2000
  );

alter table public.territory_points
  drop constraint if exists territory_points_text_lengths_check,
  add constraint territory_points_text_lengths_check check (
    char_length(description) <= 4000
    and char_length(address) <= 500
    and char_length(source_label) <= 180
    and char_length(source_note) <= 2000
  ),
  drop constraint if exists territory_points_coordinate_pair_check,
  add constraint territory_points_coordinate_pair_check check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  );
