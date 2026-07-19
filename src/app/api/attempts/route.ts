import { NextRequest, NextResponse } from "next/server";
import { recordAttempt } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.eventId || !body?.studentId || !body?.questionId || !body?.optionId) {
    return NextResponse.json({ error: "INVALID_ATTEMPT" }, { status: 400 });
  }
  try {
    return NextResponse.json(await recordAttempt(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 400 });
  }
}
