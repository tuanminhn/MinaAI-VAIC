import { NextResponse } from "next/server";
import type { PersonalizedPracticeContent } from "@/lib/ai/contracts";
import { fallbackPersonalizedPractice } from "@/lib/ai/fallbacks";
import { getPersonalizedPracticeContext } from "@/lib/server/ai-context";
import { generateStructured } from "@/lib/server/llm";
import { savePersonalizedPracticeDraft } from "@/lib/server/repository";

export const runtime = "nodejs";

function isPractice(value: unknown): value is PersonalizedPracticeContent {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PersonalizedPracticeContent>;
  if (typeof item.title !== "string" || !item.title || item.title.length > 180
    || typeof item.objective !== "string" || !item.objective || item.objective.length > 500
    || typeof item.instructions !== "string" || !item.instructions || item.instructions.length > 500
    || !Array.isArray(item.questions) || item.questions.length !== 4
    || !Array.isArray(item.citations) || !item.citations.every((citation) => typeof citation === "string")) return false;
  return item.questions.every((question, index) => {
    if (!question || question.id !== `P${index + 1}` || typeof question.stem !== "string" || !question.stem || question.stem.length > 700
      || !Array.isArray(question.options) || question.options.length < 2 || question.options.length > 5
      || typeof question.correctOptionId !== "string" || typeof question.explanation !== "string" || !question.explanation
      || typeof question.targetedMisconception !== "string" || !question.targetedMisconception
      || !["foundation", "practice", "transfer"].includes(question.difficulty)) return false;
    const optionIds = question.options.map((option) => option?.id);
    return new Set(optionIds).size === optionIds.length
      && question.options.every((option) => typeof option?.id === "string" && typeof option?.content === "string" && option.content.length > 0)
      && optionIds.includes(question.correctOptionId);
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { studentId?: string; skillId?: string };
    if (!body.studentId || !body.skillId) return NextResponse.json({ error: "Thiếu học sinh hoặc kỹ năng cần luyện." }, { status: 400 });
    const { student, context } = await getPersonalizedPracticeContext(body.studentId, body.skillId);
    const allowedCitations = new Set([
      context.skillId, ...context.approvedExamples.map((item) => item.questionId), ...context.errorEvidence.map((item) => item.questionId),
    ]);
    const generated = await generateStructured({
      task: "Tạo đúng 4 câu trắc nghiệm luyện tập cá nhân hóa bằng tiếng Việt, đi từ nền tảng đến chuyển giao. Không sao chép nguyên văn cả bộ ví dụ; đổi số liệu hoặc ngữ cảnh nhưng giữ đúng kỹ năng và lỗi cần sửa.",
      system: "Bạn là trợ lý soạn bài Toán cho giáo viên. Chỉ dùng dữ liệu học tập đã ẩn danh và nội dung đã duyệt trong context. Không nhắc tên, SBD, năng lực hay gắn nhãn học sinh. Mỗi câu có đáp án duy nhất, lời giải ngắn và targetedMisconception cụ thể. Đây là bản nháp bắt buộc giáo viên duyệt trước khi giao. citations chỉ dùng ID có trong context.",
      schema: {
        title: "string", objective: "string", instructions: "string",
        questions: [{
          id: "P1, P2, P3, P4 theo đúng thứ tự", stem: "string",
          options: [{ id: "A/B/C/D", content: "string" }], correctOptionId: "option id string",
          explanation: "string", targetedMisconception: "string", difficulty: "foundation | practice | transfer",
        }],
        citations: ["skillId or questionId from context"],
      },
      context,
      fallback: fallbackPersonalizedPractice(context),
      validate: (value): value is PersonalizedPracticeContent => isPractice(value)
        && value.citations.every((citation) => allowedCitations.has(citation)),
      requiresTeacherApproval: true,
      maxTokens: 3_500,
    });
    return NextResponse.json(await savePersonalizedPracticeDraft({
      studentId: student.id, skillId: context.skillId, content: generated.content, ai: generated.ai,
    }));
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (["STUDENT_DIAGNOSIS_NOT_FOUND", "SKILL_NOT_FOUND"].includes(code)) return NextResponse.json({ error: "Không tìm thấy chẩn đoán đã duyệt cho học sinh." }, { status: 404 });
    if (code === "SKILL_NOT_DIAGNOSED_FOR_STUDENT") return NextResponse.json({ error: "Kỹ năng này không khớp nguyên nhân gốc của học sinh." }, { status: 409 });
    return NextResponse.json({ error: "Chưa thể tạo bộ luyện tập cá nhân lúc này." }, { status: 500 });
  }
}
