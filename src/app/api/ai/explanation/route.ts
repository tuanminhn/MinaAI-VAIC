import { NextResponse } from "next/server";
import type { AnswerExplanation } from "@/lib/ai/contracts";
import { fallbackAnswerExplanation } from "@/lib/ai/fallbacks";
import { getAnswerExplanationContext } from "@/lib/server/ai-context";
import { generateStructured } from "@/lib/server/llm";
import { getStudentSession } from "@/lib/server/student-session";

export const runtime = "nodejs";

function isExplanation(value: unknown): value is AnswerExplanation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AnswerExplanation>;
  return typeof item.feedback === "string" && item.feedback.length > 0 && item.feedback.length <= 600
    && typeof item.concept === "string" && item.concept.length > 0 && item.concept.length <= 200
    && Array.isArray(item.steps) && item.steps.length >= 2 && item.steps.length <= 5 && item.steps.every((step) => typeof step === "string" && step.length <= 500)
    && typeof item.selfCheckQuestion === "string" && item.selfCheckQuestion.length > 0 && item.selfCheckQuestion.length <= 300
    && Array.isArray(item.citations) && item.citations.every((citation) => typeof citation === "string");
}

export async function POST(request: Request) {
  try {
    const student = await getStudentSession();
    if (!student) return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
    const body = await request.json() as { studentId?: string; assignmentId?: string; questionId?: string };
    if (!body.assignmentId || !body.questionId) {
      return NextResponse.json({ error: "Thiếu thông tin bài đã nộp." }, { status: 400 });
    }
    if (body.studentId && body.studentId !== student.id) return NextResponse.json({ error: "Không thể xem bài của học sinh khác." }, { status: 403 });
    const context = await getAnswerExplanationContext(student.id, body.assignmentId, body.questionId);
    const result = await generateStructured({
      task: "Giải thích một đáp án sai bằng tiếng Việt theo schema {feedback,concept,steps,selfCheckQuestion,citations}. Có 2–4 bước ngắn.",
      system: "Bạn là trợ giảng Toán phổ thông phản hồi sau khi học sinh đã nộp bài diagnostic. Chỉ dùng nội dung đã duyệt trong ngữ cảnh. Giải thích thân thiện, cụ thể, không gắn nhãn năng lực, không suy đoán ngoài bằng chứng. Có thể nêu đáp án đúng vì bài đã khóa. citations chỉ chứa mã câu hỏi trong ngữ cảnh.",
      schema: {
        feedback: "string", concept: "string", steps: ["string (2–4 items)"],
        selfCheckQuestion: "string", citations: ["questionId string from context"],
      },
      context,
      fallback: fallbackAnswerExplanation(context),
      validate: (value): value is AnswerExplanation => isExplanation(value) && value.citations.every((citation) => citation === context.questionId),
      requiresTeacherApproval: false,
    });
    return NextResponse.json({ ...result.content, ai: result.ai });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "ASSESSMENT_NOT_COMPLETE") return NextResponse.json({ error: "Em cần nộp đủ bài trước khi xem giải thích." }, { status: 409 });
    if (code === "EXPLANATION_ONLY_FOR_INCORRECT") return NextResponse.json({ error: "Câu này đã đúng nên không cần giải thích lỗi sai." }, { status: 409 });
    if (code.endsWith("NOT_FOUND")) return NextResponse.json({ error: "Không tìm thấy câu trả lời đã nộp." }, { status: 404 });
    return NextResponse.json({ error: "Chưa thể tạo giải thích lúc này." }, { status: 500 });
  }
}
