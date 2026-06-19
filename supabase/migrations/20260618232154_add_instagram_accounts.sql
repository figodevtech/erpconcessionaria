create table if not exists public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instagram_user_id text not null,
  username text,
  account_type text,
  media_count integer,
  access_token text not null,
  token_type text,
  scope text,
  expires_at timestamptz,
  connected_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id),
  unique (instagram_user_id)
);

create index if not exists idx_instagram_accounts_user_id
on public.instagram_accounts(user_id);

alter table public.instagram_accounts enable row level security;

drop policy if exists "Users can read own instagram account" on public.instagram_accounts;
create policy "Users can read own instagram account"
on public.instagram_accounts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can delete own instagram account" on public.instagram_accounts;
create policy "Users can delete own instagram account"
on public.instagram_accounts
for delete
to authenticated
using (auth.uid() = user_id);

insert into public.permissions (slug, module, action, description)
select slug, module, action, description
from (
  values
    ('settings:accounts:view', 'contas', 'view', 'Visualizar contas conectadas'),
    ('settings:accounts:update', 'contas', 'update', 'Conectar e remover contas externas')
) as new_permissions(slug, module, action, description)
where not exists (
  select 1
  from public.permissions p
  where p.slug = new_permissions.slug
);

insert into public.role_permissions (role_name, permission_slug)
select pr.name, p.slug
from public.profiles pr
cross join public.permissions p
where p.slug in ('settings:accounts:view', 'settings:accounts:update')
  and pr.name = 'Administrador'
  and not exists (
    select 1
    from public.role_permissions rp
    where rp.role_name = pr.name
      and rp.permission_slug = p.slug
  );
