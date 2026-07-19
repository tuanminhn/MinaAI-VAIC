import { NextRequest, NextResponse } from "next/server";
import { recordAttempt } from "@/lib/server/repository";
import { getStudentSession } from "@/lib/server/student-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "STUDENT_SESSION_REQUIRED" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.eventId || !body?.studentId || !body?.questionId || !body?.optionId) {
    return NextResponse.json({ error: "INVALID_ATTEMPT" }, { status: 400 });
  }
  if (body.studentId !== session.id) return NextResponse.json({ error: "STUDENT_SESSION_MISMATCH" }, { status: 403 });
  try {
    return NextResponse.json(await recordAttempt(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 400 });
  }
}
