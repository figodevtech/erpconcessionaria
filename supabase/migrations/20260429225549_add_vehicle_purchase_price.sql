alter table public.vehicles
  add column if not exists purchase_price numeric(14, 2) null;
