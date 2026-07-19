import { NextRequest, NextResponse } from "next/server";
import { submitTransfer } from "@/lib/server/repository";
import { getStudentSession } from "@/lib/server/student-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "STUDENT_SESSION_REQUIRED" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.studentId || !Array.isArray(body?.answers)) {
    return NextResponse.json({ error: "INVALID_TRANSFER" }, { status: 400 });
  }
  if (body.studentId !== session.id) return NextResponse.json({ error: "STUDENT_SESSION_MISMATCH" }, { status: 403 });
  return NextResponse.json(await submitTransfer(session.id, body.answers));
}
