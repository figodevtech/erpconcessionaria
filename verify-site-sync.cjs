const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

function checkSyntax(dir) {
  let files = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files += checkSyntax(file);
    else if (/\.tsx?$/.test(file)) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      assert.equal(source.parseDiagnostics.length, 0, `${file}: ${source.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join(', ')}`);
      files += 1;
    }
  }
  return files;
}

function loadHelper() {
  const records = new Map();
  const requests = [];
  let mode = 'success';
  let enqueueFails = false;
  const admin = { rpc: async (name, values) => {
    if (name === 'site_sync_enqueue') {
      if (enqueueFails) return { error: { code: 'MISSING_MIGRATION' } };
      records.set(values.p_event_id, { id: values.p_event_id, topics: values.p_topics, vehicle_ids: values.p_vehicle_ids, delivered_at: null });
      return { error: null };
    }
    if (name === 'site_sync_get_event') return { data: records.has(values.p_event_id) ? [records.get(values.p_event_id)] : [], error: null };
    if (name === 'site_sync_pending') return { data: [...records.values()].filter((row) => !row.delivered_at).slice(0, values.p_limit), error: null };
    if (name === 'site_sync_complete') {
      if (!values.p_error) records.get(values.p_event_id).delivered_at = 'confirmed';
      return { error: null };
    }
    throw new Error('Unexpected RPC ' + name);
  } };
  const source = fs.readFileSync(path.join(__dirname, 'src/lib/site-revalidation.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const context = vm.createContext({
    exports: module.exports, module,
    require: (name) => name === 'server-only' ? {} : name === '@/utils/supabase/server' ? { createAdminClient: async () => ({ supabase: admin }) } : require(name),
    process: { env: { SITE_REVALIDATE_URL: 'https://example.invalid/api/revalidate', SITE_REVALIDATE_SECRET: 'test-only' } },
    URL, AbortSignal,
    console: { error() {} },
    fetch: async (_url, options) => {
      const payload = JSON.parse(options.body);
      requests.push(payload);
      assert.equal(options.redirect, 'error');
      assert.equal(options.cache, 'no-store');
      if (mode === 'network') throw new Error('network unavailable');
      return { ok: mode === 'success', status: mode === 'unauthorized' ? 401 : 200, json: async () => ({ revalidated: true, eventId: mode === 'wrong-ack' ? 'different-event' : payload.eventId }) };
    },
  });
  vm.runInContext(code, context);
  return { api: module.exports, records, requests, setMode: (value) => { mode = value; }, failEnqueue: () => { enqueueFails = true; } };
}

async function checkCronAuthentication() {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'src/app/api/site-sync/retry/route.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports:{}};
  let executions = 0;
  let failWorker = false;
  const environment = {SITE_SYNC_CRON_SECRET:'fixture-only-secret-at-least-32-characters'};
  vm.runInNewContext(code,{
    exports:module.exports,module,Buffer,process:{env:environment},
    require:(name)=>name==='next/server' ? {NextResponse:{json:(body,init)=>Response.json(body,init)}} : name==='@/lib/site-revalidation' ? {retryPendingSiteEvents:async()=>{executions++;if(failWorker)throw new Error('offline');return {processed:1,published:1,pending:0}}} : require(name)
  });
  const req = (token)=>new Request('https://erp.invalid/api/site-sync/retry',{headers:token?{authorization:token}:{}});
  assert.equal((await module.exports.GET(req())).status,401);
  assert.equal((await module.exports.GET(req('Bearer wrong-secret'))).status,401);
  assert.equal(executions,0,'Unauthorized cron calls must not read or deliver outbox events');
  assert.equal((await module.exports.GET(req('Bearer '+environment.SITE_SYNC_CRON_SECRET))).status,200);
  failWorker=true;
  assert.equal((await module.exports.GET(req('Bearer '+environment.SITE_SYNC_CRON_SECRET))).status,503);
  delete environment.SITE_SYNC_CRON_SECRET;
  assert.equal((await module.exports.GET(req())).status,401);
  const proxyCode=ts.transpileModule(fs.readFileSync(path.join(__dirname,'src/proxy.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const proxyModule={exports:{}};
  let sessionExecutions=0;
  vm.runInNewContext(proxyCode,{
    exports:proxyModule.exports,module:proxyModule,
    require:(name)=>name==='next/server'?{NextResponse:{next:()=>({tokenProtectedRoute:true})}}:{updateSession:async()=>{sessionExecutions++;return {sessionProtectedRoute:true}}}
  });
  assert.equal((await proxyModule.exports.proxy({nextUrl:{pathname:'/api/site-sync/retry'}})).tokenProtectedRoute,true);
  assert.equal(sessionExecutions,0);
  await proxyModule.exports.proxy({nextUrl:{pathname:'/api/vehicles'}});
  assert.equal(sessionExecutions,1,'Only the bearer-protected cron endpoint may bypass session auth');
}

(async () => {
  const fileCount = checkSyntax(path.join(__dirname, 'src'));
  const env = loadHelper();
  const first = await env.api.publishSiteChanges({ topics: ['vehicles','vehicles'], vehicleIds: ['12',12,-1,'bad'] });
  assert.equal(first.status, 'published');
  assert.deepEqual(JSON.parse(JSON.stringify(env.requests[0].vehicleIds)), [12]);
  assert.deepEqual(JSON.parse(JSON.stringify(env.requests[0].topics)), ['vehicles']);
  assert.ok(env.records.get(first.eventId).delivered_at);
  env.setMode('network');
  const beforeFail = env.requests.length;
  const failed = await env.api.publishSiteChanges({ topics: ['vehicles'], vehicleIds: [12] });
  assert.equal(failed.status, 'pending');
  assert.equal(env.requests.length - beforeFail, 2);
  env.setMode('success');
  const retried = await env.api.retrySiteEvent(failed.eventId);
  assert.equal(retried.status, 'published');
  assert.equal(env.records.size, 2, 'Retry must not enqueue/repeat the mutation');
  const beforeDeliveredRetry = env.requests.length;
  await env.api.retrySiteEvent(failed.eventId);
  assert.equal(env.requests.length, beforeDeliveredRetry, 'Already confirmed event is idempotent');
  env.setMode('unauthorized');
  const beforeUnauthorized = env.requests.length;
  const unauthorized = await env.api.publishSiteChanges({ topics: ['banners'] });
  assert.equal(unauthorized.status, 'pending');
  assert.equal(env.requests.length - beforeUnauthorized, 1);
  env.setMode('wrong-ack');
  assert.equal((await env.api.publishSiteChanges({ topics: ['settings'] })).status, 'pending');
  env.setMode('success');
  const batch = await env.api.retryPendingSiteEvents();
  assert.equal(batch.pending, 0);
  assert.equal(batch.published, 2);
  const large = await env.api.publishSiteChanges({ topics: ['vehicles'], vehicleIds: Array.from({length:501}, (_,i)=>i+1) });
  assert.equal(large.status, 'published');
  assert.equal(env.requests.at(-1).vehicleIds.length, 1);
  assert.notEqual(env.requests.at(-1).eventId, env.requests.at(-2).eventId);
  env.failEnqueue();
  const beforeMissingMigration = env.requests.length;
  const unavailable = await env.api.publishSiteChanges({ topics: ['vehicles'] });
  assert.equal(unavailable.status, 'pending');
  assert.equal(unavailable.retryable, false, 'An unpersisted event must not offer a broken retry action');
  assert.equal(env.requests.length, beforeMissingMigration, 'Missing outbox cannot be reported as published');
  await checkCronAuthentication();
  console.log(`Parsed ${fileCount} TS/TSX files. Passed publication scenarios (ACK, normalization, failures, retries, idempotence, batching, recovery, missing migration), cron bearer auth, and exact proxy bypass.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
