import { NextResponse } from "next/server";
import { getDemoPayload } from "@/lib/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getDemoPayload());
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return NextResponse.json({ error: message }, { status: message === "DEMO_NOT_SEEDED" ? 503 : 500 });
  }
}
