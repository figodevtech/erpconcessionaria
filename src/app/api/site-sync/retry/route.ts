import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { retryPendingSiteEvents } from "@/lib/site-revalidation";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.SITE_SYNC_CRON_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";
  if (!expected || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await retryPendingSiteEvents(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Site publication retry is unavailable" }, { status: 503 });
  }
}
