import { NextRequest, NextResponse } from "next/server";
import { assignRemediation, getRemediation } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "STUDENT_ID_REQUIRED" }, { status: 400 });
  return NextResponse.json(await getRemediation(studentId));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.studentId) return NextResponse.json({ error: "STUDENT_ID_REQUIRED" }, { status: 400 });
  if (body.pathId === null || (body.pathId !== undefined && typeof body.pathId !== "string")) {
    return NextResponse.json({ error: "Chưa có lộ trình củng cố phù hợp cho chẩn đoán này." }, { status: 400 });
  }
  return NextResponse.json(await assignRemediation(body.studentId, body.pathId));
}
