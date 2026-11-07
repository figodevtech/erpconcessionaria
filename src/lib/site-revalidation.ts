import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/server";
import type { SiteSyncResult, SiteSyncTopic } from "@/types/site-sync";

type SiteSyncEvent = {
  id: string;
  topics: SiteSyncTopic[];
  vehicle_ids: number[];
  delivered_at?: string | null;
};

type SiteChange = { topics: SiteSyncTopic[]; vehicleIds?: (string | number)[] };
const REQUEST_TIMEOUT_MS = 3_000;

function normalizeVehicleIds(ids: (string | number)[] = []) {
  return [...new Set(ids.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))];
}

async function sendToSite(event: SiteSyncEvent): Promise<boolean> {
  if (event.vehicle_ids.length > 500) {
    for (let offset = 0; offset < event.vehicle_ids.length; offset += 500) {
      if (!await sendToSite({ ...event, id: `${event.id}:${offset / 500}`, vehicle_ids: event.vehicle_ids.slice(offset, offset + 500) })) return false;
    }
    return true;
  }
  const configuredUrl = process.env.SITE_REVALIDATE_URL;
  const secret = process.env.SITE_REVALIDATE_SECRET;
  if (!configuredUrl || !secret) return false;

  let url: URL;
  try {
    url = new URL(configuredUrl);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      return false;
    }
  } catch {
    return false;
  }

  // Retrying invalidation is safe: it never repeats the business mutation.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, topics: event.topics, vehicleIds: event.vehicle_ids }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const result: unknown = await response.json();
      if (response.ok && result && typeof result === "object" && "revalidated" in result && result.revalidated === true && "eventId" in result && result.eventId === event.id) {
        return true;
      }
      // Invalid credentials/payload need configuration changes, not a second request.
      if (response.status >= 400 && response.status < 500 && response.status !== 429) break;
    } catch {
      // Do not log response bodies, URLs, credentials or customer/vehicle contents.
    }
  }
  return false;
}

async function deliverEvent(event: SiteSyncEvent): Promise<SiteSyncResult> {
  if (event.delivered_at) return { status: "published", eventId: event.id };
  const published = await sendToSite(event);
  const { supabase: admin } = await createAdminClient();
  if (admin) {
    const { error } = await admin.rpc("site_sync_complete", {
      p_event_id: event.id,
      p_error: published ? null : "Site invalidation was not confirmed",
    });
    if (error) console.error("Could not record site publication result", { eventId: event.id, code: error.code });
  }
  return { status: published ? "published" : "pending", eventId: event.id, retryable: !published };
}

/** Call only on the server, after the database has confirmed a public-content write. */
export async function publishSiteChanges(change: SiteChange): Promise<SiteSyncResult> {
  const eventId = randomUUID();
  const event: SiteSyncEvent = { id: eventId, topics: [...new Set(change.topics)], vehicle_ids: normalizeVehicleIds(change.vehicleIds) };
  let persisted = false;
  try {
    const { supabase: admin } = await createAdminClient();
    if (!admin) return { status: "pending", eventId, retryable: false };
    const { error } = await admin.rpc("site_sync_enqueue", {
      p_event_id: eventId,
      p_topics: event.topics,
      p_vehicle_ids: event.vehicle_ids,
    });
    if (error) {
      console.error("Site publication outbox is unavailable", { eventId, code: error.code });
      return { status: "pending", eventId, retryable: false };
    }
    persisted = true;
    return await deliverEvent(event);
  } catch {
    console.error("Site publication remains pending", { eventId });
    return { status: "pending", eventId, retryable: persisted };
  }
}

export async function retrySiteEvent(eventId: string): Promise<SiteSyncResult | null> {
  const { supabase: admin } = await createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.rpc("site_sync_get_event", { p_event_id: eventId });
  if (error || !data?.[0]) return null;
  return deliverEvent(data[0] as SiteSyncEvent);
}

export async function retryPendingSiteEvents() {
  const { supabase: admin } = await createAdminClient();
  if (!admin) throw new Error("Site publication backend is not configured");
  const { data, error } = await admin.rpc("site_sync_pending", { p_limit: 20 });
  if (error) throw new Error("Site publication outbox is unavailable");
  const events = (data ?? []) as SiteSyncEvent[];
  let published = 0;
  for (let offset = 0; offset < events.length; offset += 4) {
    const results = await Promise.all(events.slice(offset, offset + 4).map(deliverEvent));
    published += results.filter((result) => result.status === "published").length;
  }
  return { processed: events.length, published, pending: events.length - published };
}
