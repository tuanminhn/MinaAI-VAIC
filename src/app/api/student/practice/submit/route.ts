import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/server/student-session";
import { submitPersonalizedPractice } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const student = await getStudentSession();
    if (!student) return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
    const body = await request.json() as { practiceId?: string; answers?: Record<string, string> };
    if (!body.practiceId || !body.answers) return NextResponse.json({ error: "Thiếu bài luyện tập hoặc câu trả lời." }, { status: 400 });
    return NextResponse.json(await submitPersonalizedPractice(student.id, body.practiceId, body.answers));
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const messages: Record<string, string> = {
      PRACTICE_NOT_FOUND: "Không tìm thấy bài luyện tập của em.",
      PRACTICE_NOT_SUBMITTABLE: "Bài luyện tập này đã được nộp hoặc chưa được giao.",
      PRACTICE_INCOMPLETE: "Hãy trả lời đủ tất cả câu hỏi trước khi nộp.",
    };
    return NextResponse.json({ error: messages[code] ?? "Chưa thể nộp bài luyện tập lúc này." }, { status: code === "PRACTICE_NOT_FOUND" ? 404 : 409 });
  }
}
