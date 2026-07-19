import { NextResponse } from "next/server";
import type { ReteachPlan } from "@/lib/ai/contracts";
import { fallbackReteachPlan } from "@/lib/ai/fallbacks";
import { getReteachContext } from "@/lib/server/ai-context";
import { generateStructured } from "@/lib/server/llm";

export const runtime = "nodejs";

function isPlan(value: unknown): value is ReteachPlan {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ReteachPlan>;
  return typeof item.title === "string" && typeof item.objective === "string" && typeof item.durationMinutes === "number"
    && typeof item.group?.skillId === "string" && typeof item.group?.skillName === "string" && typeof item.group?.studentCount === "number"
    && Array.isArray(item.agenda) && item.agenda.every((entry) => typeof entry?.minutes === "number" && typeof entry?.activity === "string" && typeof entry?.teacherMove === "string")
    && typeof item.workedExample === "string" && Array.isArray(item.checks) && item.checks.every((entry) => typeof entry === "string")
    && typeof item.differentiation?.support === "string" && typeof item.differentiation?.extension === "string"
    && Array.isArray(item.citations) && item.citations.every((entry) => typeof entry === "string");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { rootCauseSkillId?: string; durationMinutes?: number };
    if (!body.rootCauseSkillId) return NextResponse.json({ error: "Thiếu kỹ năng cần dạy lại." }, { status: 400 });
    const duration = Math.min(30, Math.max(10, Number(body.durationMinutes ?? 15)));
    const context = await getReteachContext(body.rootCauseSkillId);
    const result = await generateStructured({
      task: `Soạn bản nháp kế hoạch dạy lại ${duration} phút bằng tiếng Việt theo schema {title,objective,durationMinutes,group,agenda,workedExample,checks,differentiation,citations}.`,
      system: "Bạn là trợ lý soạn bài cho giáo viên Toán. Chỉ dùng dữ liệu nhóm ẩn danh và nội dung đã duyệt. Kế hoạch phải khả thi trong lớp đông, có kiểm tra nhanh và phân hóa. Đây là bản nháp, không tự giao cho học sinh. Giữ nguyên group và durationMinutes. citations chỉ chứa skillId trong ngữ cảnh.",
      schema: {
        title: "string", objective: "string", durationMinutes: "number equal to requested duration",
        group: { skillId: "string from context", skillName: "string from context", studentCount: "number from context" },
        agenda: [{ minutes: "number", activity: "string", teacherMove: "string" }],
        workedExample: "string", checks: ["string"],
        differentiation: { support: "string", extension: "string" },
        citations: ["skillId string from context"],
      },
      context,
      fallback: fallbackReteachPlan(context, duration),
      validate: (value): value is ReteachPlan => isPlan(value) && value.durationMinutes === duration
        && value.group.skillId === context.skillId && value.group.studentCount === context.studentCount
        && value.citations.every((id) => id === context.skillId),
      requiresTeacherApproval: true,
    });
    return NextResponse.json({ ...result.content, ai: result.ai });
  } catch (error) {
    const status = error instanceof Error && error.message === "SKILL_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "Không tìm thấy kỹ năng đã duyệt." : "Chưa thể tạo kế hoạch dạy lại lúc này." }, { status });
  }
}
