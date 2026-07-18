import { NextRequest, NextResponse } from "next/server";
import { registerDemoStudent } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.displayName || !body?.studentNumber) {
    return NextResponse.json({ error: "STUDENT_INFO_REQUIRED" }, { status: 400 });
  }
  try {
    return NextResponse.json(await registerDemoStudent(body.displayName, body.studentNumber));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
