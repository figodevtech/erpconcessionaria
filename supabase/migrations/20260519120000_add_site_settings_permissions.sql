insert into public.permissions (slug, module, action, description)
select slug, module, action, description
from (
  values
    ('settings:site:view', 'site', 'view', 'Visualizar configuracoes do site'),
    ('settings:site:update', 'site', 'update', 'Atualizar configuracoes do site')
) as new_permissions(slug, module, action, description)
where not exists (
  select 1
  from public.permissions p
  where p.slug = new_permissions.slug
);

insert into public.role_permissions (role_name, permission_slug)
select 'Administrador', p.slug
from public.permissions p
where p.slug in ('settings:site:view', 'settings:site:update')
  and exists (
    select 1
    from public.profiles pr
    where pr.name = 'Administrador'
  )
  and not exists (
    select 1
    from public.role_permissions rp
    where rp.role_name = 'Administrador'
      and rp.permission_slug = p.slug
  );
