do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'INSERT'
      and with_check ilike '%bucket_id%vehicles%'
      and with_check not ilike '%private%'
  ) then
    create policy "Allow authenticated uploads to vehicles bucket"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'vehicles');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'UPDATE'
      and coalesce(qual, with_check, '') ilike '%bucket_id%vehicles%'
      and coalesce(qual, with_check, '') not ilike '%private%'
  ) then
    create policy "Allow authenticated updates to vehicles bucket"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'vehicles')
    with check (bucket_id = 'vehicles');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'DELETE'
      and coalesce(qual, with_check, '') ilike '%bucket_id%vehicles%'
      and coalesce(qual, with_check, '') not ilike '%private%'
  ) then
    create policy "Allow authenticated deletes from vehicles bucket"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'vehicles');
  end if;
end $$;
