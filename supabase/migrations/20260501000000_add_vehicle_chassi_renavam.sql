alter table public.vehicles
  add column if not exists chassi text null,
  add column if not exists renavam text null;

create index if not exists idx_vehicles_chassi on public.vehicles using btree (chassi);
create index if not exists idx_vehicles_renavam on public.vehicles using btree (renavam);
