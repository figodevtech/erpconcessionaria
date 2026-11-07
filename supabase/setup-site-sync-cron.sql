-- POST-DEPLOY SETUP ONLY. Not an automatic migration and not executed here.
-- 1. Enable pg_cron and pg_net in the ERP project's Database > Extensions.
-- 2. In Vault create these secrets using the dashboard (never commit values):
--    site_sync_retry_url   = https://ERP_HOST/api/site-sync/retry
--    site_sync_cron_secret = same value as ERP env SITE_SYNC_CRON_SECRET
-- 3. Run this script as the database operator in that same ERP project.
-- References:
-- https://supabase.com/docs/guides/functions/schedule-functions
-- https://supabase.com/docs/guides/database/extensions/pg_net

do $$
begin
  if to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') is null or
     to_regprocedure('cron.schedule(text,text,text)') is null then
    raise exception 'Enable pg_net and pg_cron before scheduling site publication retries';
  end if;
  if (select count(*) from vault.decrypted_secrets where name='site_sync_retry_url') <> 1 or
     (select count(*) from vault.decrypted_secrets where name='site_sync_cron_secret') <> 1 then
    raise exception 'Configure both site-sync Vault secrets before scheduling';
  end if;
  if not coalesce((select decrypted_secret ~ '^https://[^[:space:]]+/api/site-sync/retry$' from vault.decrypted_secrets where name='site_sync_retry_url'), false) then
    raise exception 'site_sync_retry_url must be the deployed HTTPS retry endpoint';
  end if;
  if coalesce((select length(decrypted_secret) from vault.decrypted_secrets where name='site_sync_cron_secret'),0) < 32 then
    raise exception 'Use a site-sync cron secret with at least 32 characters';
  end if;
end;
$$;

select cron.schedule(
  'erp-site-sync-retry',
  '* * * * *',
  $job$
    select net.http_get(
      url := (select decrypted_secret from vault.decrypted_secrets where name='site_sync_retry_url'),
      headers := jsonb_build_object('Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='site_sync_cron_secret')),
      timeout_milliseconds := 55000
    );
  $job$
);

-- Inspect scheduler status without selecting the Vault values or request headers:
-- select jobid, schedule, active from cron.job where jobname='erp-site-sync-retry';
-- select status, start_time, end_time from cron.job_run_details
-- where jobid=(select jobid from cron.job where jobname='erp-site-sync-retry')
-- order by start_time desc limit 10;
-- The cron SQL succeeds when the HTTP request is queued. Also inspect HTTP
-- status/error responses in net._http_response when diagnosing delivery.
-- Disable this specific job if needed:
-- select cron.unschedule('erp-site-sync-retry');
