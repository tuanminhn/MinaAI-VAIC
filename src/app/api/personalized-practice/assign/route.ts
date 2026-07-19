import { NextResponse } from "next/server";
import { assignPersonalizedPractice } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { practiceId?: string };
    if (!body.practiceId) return NextResponse.json({ error: "Thiếu bản nháp cần giao." }, { status: 400 });
    const practice = await assignPersonalizedPractice(body.practiceId);
    return NextResponse.json(practice);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: code === "PRACTICE_DRAFT_NOT_ASSIGNABLE" ? "Bản nháp không còn ở trạng thái chờ duyệt." : "Chưa thể giao bài lúc này." }, { status: code === "PRACTICE_DRAFT_NOT_ASSIGNABLE" ? 409 : 500 });
  }
}
