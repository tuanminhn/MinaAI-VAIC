import { NextResponse } from "next/server";
import type { ClassSummary } from "@/lib/ai/contracts";
import { fallbackClassSummary } from "@/lib/ai/fallbacks";
import { getClassContext } from "@/lib/server/ai-context";
import { generateStructured } from "@/lib/server/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSummary(value: unknown): value is ClassSummary {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ClassSummary>;
  return typeof item.headline === "string" && typeof item.overview === "string"
    && Array.isArray(item.priorities) && item.priorities.every((entry) => typeof entry?.title === "string" && typeof entry?.reason === "string" && typeof entry?.studentCount === "number")
    && Array.isArray(item.classWideGaps) && item.classWideGaps.every((entry) => typeof entry?.skillId === "string" && typeof entry?.skillName === "string" && typeof entry?.studentCount === "number" && typeof entry?.reason === "string")
    && Array.isArray(item.nextActions) && item.nextActions.every((entry) => typeof entry === "string")
    && Array.isArray(item.citations) && item.citations.every((entry) => typeof entry === "string");
}

export async function POST() {
  try {
    const context = await getClassContext();
    const allowedSkillIds = new Set(context.gaps.map((gap) => gap.skillId));
    const result = await generateStructured({
      task: "Tóm tắt tình hình lớp bằng tiếng Việt theo schema {headline,overview,priorities,classWideGaps,nextActions,citations}. Tối đa 3 mục mỗi danh sách.",
      system: "Bạn là trợ lý phân tích cho giáo viên. Chỉ dùng dữ liệu tổng hợp đã ẩn danh và nội dung được duyệt. Không suy đoán cá nhân, không quyết định điểm/xếp lớp. Nêu rõ khi thiếu dữ liệu. Giữ nguyên skillId và số lượng trong ngữ cảnh. citations chỉ chứa skillId có trong ngữ cảnh.",
      schema: {
        headline: "string", overview: "string",
        priorities: [{ title: "string", reason: "string", studentCount: "number" }],
        classWideGaps: [{ skillId: "string from context", skillName: "string", studentCount: "number", reason: "string" }],
        nextActions: ["string"], citations: ["skillId string from context"],
      },
      context,
      fallback: fallbackClassSummary(context),
      validate: (value): value is ClassSummary => isSummary(value)
        && value.citations.every((id) => allowedSkillIds.has(id))
        && value.classWideGaps.every((gap) => allowedSkillIds.has(gap.skillId)),
      requiresTeacherApproval: true,
    });
    return NextResponse.json({ ...result.content, ai: result.ai });
  } catch {
    return NextResponse.json({ error: "Chưa thể tạo tóm tắt lớp lúc này." }, { status: 500 });
  }
}
