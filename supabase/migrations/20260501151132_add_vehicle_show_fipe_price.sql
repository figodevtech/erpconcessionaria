alter table if exists public.vehicles
  add column if not exists show_fipe_price boolean not null default false;
