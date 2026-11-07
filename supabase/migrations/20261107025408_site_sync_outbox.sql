-- Transactional publication outbox. Created with `supabase migration new
-- site_sync_outbox`; review and apply only to the ERP's Supabase project.
-- Only server service-role RPCs may read/deliver events. Content writes enqueue
-- events in the same transaction, including writes outside the ERP HTTP routes.
create schema if not exists site_sync_private;
revoke all on schema site_sync_private from public, anon, authenticated;
grant usage on schema site_sync_private to service_role;

create table site_sync_private.outbox (
  id uuid primary key default gen_random_uuid(),
  topics text[] not null check (cardinality(topics) between 1 and 4 and topics <@ array['vehicles','shorts','banners','settings']::text[]),
  vehicle_ids bigint[] not null default '{}',
  created_at timestamptz not null default clock_timestamp(),
  delivered_at timestamptz,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text
);
alter table site_sync_private.outbox enable row level security;
revoke all on site_sync_private.outbox from public, anon, authenticated;
grant select, insert, update on site_sync_private.outbox to service_role;
create index site_sync_outbox_pending_idx on site_sync_private.outbox(next_attempt_at, created_at) where delivered_at is null;

-- SECURITY DEFINER is limited to this non-exposed trigger: authenticated content
-- writers cannot access the outbox schema directly. No payload contains row data.
create function site_sync_private.record_content_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  change_topics text[];
  ids bigint[] := '{}';
  current_row jsonb;
  previous_row jsonb;
begin
  if tg_op <> 'DELETE' then current_row := to_jsonb(new); end if;
  if tg_op <> 'INSERT' then previous_row := to_jsonb(old); end if;
  if tg_table_name = 'app_settings' then
    if tg_op = 'UPDATE' and
      jsonb_build_array(current_row->'primary_color',current_row->'secondary_color',current_row->'banner_interval',current_row->'banner_duration')
      is not distinct from
      jsonb_build_array(previous_row->'primary_color',previous_row->'secondary_color',previous_row->'banner_interval',previous_row->'banner_duration') then
      return new;
    end if;
    change_topics := array['settings'];
  elsif tg_table_name = 'banners' then
    change_topics := array['banners'];
  else
    change_topics := case when tg_table_name in ('vehicles','vehicle_videos') then array['vehicles','shorts'] else array['vehicles'] end;
    if tg_table_name = 'vehicles' then
      select coalesce(array_agg(distinct v), '{}') into ids
      from unnest(array[(current_row->>'id')::bigint,(previous_row->>'id')::bigint]) v where v is not null;
    else
      select coalesce(array_agg(distinct v), '{}') into ids
      from unnest(array[(current_row->>'vehicle_id')::bigint,(previous_row->>'vehicle_id')::bigint]) v where v is not null;
    end if;
  end if;
  insert into site_sync_private.outbox(topics,vehicle_ids) values (change_topics,ids);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function site_sync_private.record_content_change() from public, anon, authenticated, service_role;

create trigger site_sync_vehicles after insert or update or delete on public.vehicles for each row execute function site_sync_private.record_content_change();
create trigger site_sync_images after insert or update or delete on public.vehicle_images for each row execute function site_sync_private.record_content_change();
create trigger site_sync_videos after insert or update or delete on public.vehicle_videos for each row execute function site_sync_private.record_content_change();
create trigger site_sync_banners after insert or update or delete on public.banners for each row execute function site_sync_private.record_content_change();
create trigger site_sync_settings after insert or update or delete on public.app_settings for each row execute function site_sync_private.record_content_change();

create function site_sync_private.enqueue(p_event_id uuid,p_topics text[],p_vehicle_ids bigint[])
returns void language sql security invoker set search_path = '' as $$
  insert into site_sync_private.outbox(id,topics,vehicle_ids)
  values(p_event_id,p_topics,coalesce(p_vehicle_ids,'{}')) on conflict(id) do nothing;
$$;

create function site_sync_private.get_event(p_event_id uuid)
returns table(id uuid,topics text[],vehicle_ids bigint[],delivered_at timestamptz)
language sql security invoker set search_path = '' as $$
  select e.id,e.topics,e.vehicle_ids,e.delivered_at from site_sync_private.outbox e where e.id=p_event_id;
$$;

create function site_sync_private.pending(p_limit integer)
returns table(id uuid,topics text[],vehicle_ids bigint[],delivered_at timestamptz)
language sql security invoker set search_path = '' as $$
  select e.id,e.topics,e.vehicle_ids,e.delivered_at from site_sync_private.outbox e
  where e.delivered_at is null and e.next_attempt_at <= now()
  order by e.next_attempt_at,e.created_at limit least(greatest(p_limit,1),100);
$$;

create function site_sync_private.complete(p_event_id uuid,p_error text)
returns void language sql security invoker set search_path = '' as $$
  update site_sync_private.outbox set
    delivered_at=case when p_error is null then clock_timestamp() else delivered_at end,
    attempts=attempts+1,
    last_error=case when p_error is null then null else left(p_error,500) end,
    next_attempt_at=clock_timestamp()+make_interval(secs=>least(3600,30*power(2,least(attempts,7)))::double precision)
  where id=p_event_id and delivered_at is null;
$$;

revoke all on function site_sync_private.enqueue(uuid,text[],bigint[]),site_sync_private.get_event(uuid),site_sync_private.pending(integer),site_sync_private.complete(uuid,text) from public, anon, authenticated;
grant execute on function site_sync_private.enqueue(uuid,text[],bigint[]),site_sync_private.get_event(uuid),site_sync_private.pending(integer),site_sync_private.complete(uuid,text) to service_role;

-- Thin Data API bridges. Business logic and records remain in a non-exposed
-- schema; even authenticated users have no EXECUTE on these RPCs.
create function public.site_sync_enqueue(p_event_id uuid,p_topics text[],p_vehicle_ids bigint[])
returns void language sql security invoker set search_path = '' as $$ select site_sync_private.enqueue(p_event_id,p_topics,p_vehicle_ids); $$;
create function public.site_sync_get_event(p_event_id uuid)
returns table(id uuid,topics text[],vehicle_ids bigint[],delivered_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from site_sync_private.get_event(p_event_id); $$;
create function public.site_sync_pending(p_limit integer default 20)
returns table(id uuid,topics text[],vehicle_ids bigint[],delivered_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from site_sync_private.pending(p_limit); $$;
create function public.site_sync_complete(p_event_id uuid,p_error text default null)
returns void language sql security invoker set search_path = '' as $$ select site_sync_private.complete(p_event_id,p_error); $$;
revoke all on function public.site_sync_enqueue(uuid,text[],bigint[]),public.site_sync_get_event(uuid),public.site_sync_pending(integer),public.site_sync_complete(uuid,text) from public, anon, authenticated;
grant execute on function public.site_sync_enqueue(uuid,text[],bigint[]),public.site_sync_get_event(uuid),public.site_sync_pending(integer),public.site_sync_complete(uuid,text) to service_role;
