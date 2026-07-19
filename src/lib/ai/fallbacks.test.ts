import { describe, expect, it } from "vitest";
import { fallbackAnswerExplanation, fallbackClassSummary, fallbackReteachPlan } from "./fallbacks";

describe("AI deterministic fallbacks", () => {
  it("explains an incorrect answer only from approved post-submission context", () => {
    const result = fallbackAnswerExplanation({
      questionId: "Q.TEST.001", stem: "Một câu hỏi mẫu", selectedContent: "24", correctContent: "12",
      approvedExplanation: "Tìm bội chung nhỏ nhất theo từng bước.", skillNames: ["Tìm bội chung nhỏ nhất"],
      misconception: "Nhầm bội chung với tích hai số",
    });
    expect(result.steps).toContain("Đối chiếu lại, kết quả phù hợp là: 12.");
    expect(result.feedback).toContain("Nhầm bội chung với tích hai số".toLowerCase());
    expect(result.citations).toEqual(["Q.TEST.001"]);
  });

  it("prioritizes the largest anonymized class gap", () => {
    const result = fallbackClassSummary({
      studentCount: 40, completed: 35, diagnosed: 14, mastered: 18, insufficient: 3,
      gaps: [
        { skillId: "SKILL.A", skillName: "Kỹ năng A", description: "A", studentCount: 9, averageConfidence: 0.82 },
        { skillId: "SKILL.B", skillName: "Kỹ năng B", description: "B", studentCount: 5, averageConfidence: 0.75 },
      ],
    });
    expect(result.classWideGaps[0].skillId).toBe("SKILL.A");
    expect(result.priorities[0].studentCount).toBe(9);
  });

  it("builds a bounded, teacher-reviewable reteach plan", () => {
    const result = fallbackReteachPlan({
      skillId: "SKILL.A", skillName: "Quy đồng mẫu số", description: "Tìm mẫu số chung", studentCount: 8,
      commonMisconceptions: ["Nhân sai mẫu số"], approvedQuestionStems: ["Câu hỏi đã duyệt"],
    }, 15);
    expect(result.durationMinutes).toBe(15);
    expect(result.group.studentCount).toBe(8);
    expect(result.workedExample).toBe("Câu hỏi đã duyệt");
    expect(result.agenda.reduce((sum, step) => sum + step.minutes, 0)).toBe(15);
  });
});
