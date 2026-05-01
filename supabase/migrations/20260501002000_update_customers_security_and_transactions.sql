alter table if exists public.customers
  drop constraint if exists customers_ranked_by_fkey,
  drop constraint if exists customers_email_key,
  drop constraint if exists customers_cpf_cnpj_key,
  drop column if exists rank,
  drop column if exists ranked_by,
  drop column if exists ranked_at;

drop type if exists public.customer_rank;

create unique index if not exists idx_customers_active_email_unique
  on public.customers (lower(email))
  where is_deleted = false;

create unique index if not exists idx_customers_active_cpf_cnpj_unique
  on public.customers (cpf_cnpj)
  where is_deleted = false;

drop policy if exists "Authenticated users can read customers" on public.customers;
create policy "Authenticated users can read customers"
on public.customers for select
to authenticated
using (
  is_deleted = false
  and exists (
    select 1
    from public.users u
    join public.profiles p on p.id = u.profile_id
    left join public.role_permissions rp on rp.role_name = p.name
    where u.id = auth.uid()
      and (p.name = 'Administrador' or rp.permission_slug in ('admin', 'customers:view'))
  )
);

drop policy if exists "Authenticated users can insert customers" on public.customers;
create policy "Authenticated users can insert customers"
on public.customers for insert
to authenticated
with check (
  exists (
    select 1
    from public.users u
    join public.profiles p on p.id = u.profile_id
    left join public.role_permissions rp on rp.role_name = p.name
    where u.id = auth.uid()
      and (p.name = 'Administrador' or rp.permission_slug in ('admin', 'customers:create'))
  )
);

drop policy if exists "Authenticated users can update customers" on public.customers;
create policy "Authenticated users can update customers"
on public.customers for update
to authenticated
using (
  exists (
    select 1
    from public.users u
    join public.profiles p on p.id = u.profile_id
    left join public.role_permissions rp on rp.role_name = p.name
    where u.id = auth.uid()
      and (p.name = 'Administrador' or rp.permission_slug in ('admin', 'customers:update'))
  )
)
with check (
  exists (
    select 1
    from public.users u
    join public.profiles p on p.id = u.profile_id
    left join public.role_permissions rp on rp.role_name = p.name
    where u.id = auth.uid()
      and (p.name = 'Administrador' or rp.permission_slug in ('admin', 'customers:update'))
  )
);

alter table if exists public.transactions
  add column if not exists customer_id bigint null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and constraint_name = 'transactions_customer_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_customer_id_fkey
      foreign key (customer_id) references public.customers (id) on delete set null;
  end if;
end
$$;

create index if not exists idx_transactions_customer_id
  on public.transactions using btree (customer_id);
