import { NextRequest, NextResponse } from "next/server";
import { submitTransfer } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.studentId || !Array.isArray(body?.answers)) {
    return NextResponse.json({ error: "INVALID_TRANSFER" }, { status: 400 });
  }
  return NextResponse.json(await submitTransfer(body.studentId, body.answers));
}
