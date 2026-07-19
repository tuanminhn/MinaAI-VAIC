import type { AnswerExplanation, ClassSummary, ReteachPlan } from "./contracts";

export type AnswerExplanationContext = {
  questionId: string;
  stem: string;
  selectedContent: string;
  correctContent: string;
  approvedExplanation: string;
  skillNames: string[];
  misconception?: string;
};

export type ClassContext = {
  studentCount: number;
  completed: number;
  diagnosed: number;
  mastered: number;
  insufficient: number;
  gaps: { skillId: string; skillName: string; description: string; studentCount: number; averageConfidence: number }[];
};

export type ReteachContext = {
  skillId: string;
  skillName: string;
  description: string;
  studentCount: number;
  commonMisconceptions: string[];
  approvedQuestionStems: string[];
};

export function fallbackAnswerExplanation(context: AnswerExplanationContext): AnswerExplanation {
  const concept = context.skillNames[0] ?? "kiến thức nền của câu hỏi";
  return {
    feedback: context.misconception
      ? `Lựa chọn của em cho thấy em có thể đang gặp lỗi: ${context.misconception.toLowerCase()}.`
      : "Lựa chọn này chưa phù hợp. Em hãy xem lại nguyên tắc được dùng trong câu hỏi.",
    concept,
    steps: [
      `Đáp án em đã chọn: ${context.selectedContent}.`,
      context.approvedExplanation,
      `Đối chiếu lại, kết quả phù hợp là: ${context.correctContent}.`,
    ],
    selfCheckQuestion: `Nếu đổi số liệu nhưng vẫn dùng ${concept.toLowerCase()}, em sẽ kiểm tra bước nào trước tiên?`,
    citations: [context.questionId],
  };
}

export function fallbackClassSummary(context: ClassContext): ClassSummary {
  const topGap = context.gaps[0];
  const pending = Math.max(0, context.studentCount - context.completed);
  return {
    headline: topGap ? `${topGap.studentCount} học sinh đang cùng cần củng cố ${topGap.skillName}` : "Lớp chưa có đủ kết quả để xác định khoảng trống chung",
    overview: `${context.completed}/${context.studentCount} học sinh đã có kết quả; ${context.diagnosed} em cần củng cố, ${context.mastered} em đã nắm vững và ${context.insufficient} em cần thêm bằng chứng.`,
    priorities: [
      ...(topGap ? [{ title: `Ưu tiên nhóm ${topGap.skillName}`, reason: "Đây là khoảng trống nền xuất hiện nhiều nhất trong dữ liệu hiện có.", studentCount: topGap.studentCount }] : []),
      ...(context.insufficient ? [{ title: "Thu thêm bằng chứng", reason: "Chưa đủ dữ liệu để đưa ra hướng hỗ trợ đáng tin cậy.", studentCount: context.insufficient }] : []),
      ...(pending ? [{ title: "Nhắc học sinh chưa hoàn thành", reason: "Các em này chưa có kết quả để hệ thống phân nhóm.", studentCount: pending }] : []),
    ].slice(0, 3),
    classWideGaps: context.gaps.slice(0, 3).map((gap) => ({
      skillId: gap.skillId,
      skillName: gap.skillName,
      studentCount: gap.studentCount,
      reason: `${gap.studentCount} học sinh được chẩn đoán có nguyên nhân gốc tại kỹ năng này (độ tin cậy trung bình ${Math.round(gap.averageConfidence * 100)}%).`,
    })),
    nextActions: topGap
      ? [`Dạy lại nhanh ${topGap.skillName} trước bài chính.`, "Kiểm tra đầu ra bằng một câu tương tự nhưng đổi ngữ cảnh.", "Xem riêng các trường hợp chưa đủ bằng chứng trước khi giao bài."]
      : ["Cho lớp hoàn thành bài chẩn đoán.", "Thu thêm bằng chứng trước khi chia nhóm."],
    citations: context.gaps.slice(0, 3).map((gap) => gap.skillId),
  };
}

export function fallbackReteachPlan(context: ReteachContext, durationMinutes: number): ReteachPlan {
  const duration = Math.min(30, Math.max(10, durationMinutes));
  const launch = Math.max(2, Math.round(duration * 0.2));
  const model = Math.max(4, Math.round(duration * 0.35));
  const practice = Math.max(3, duration - launch - model - 2);
  const example = context.approvedQuestionStems[0] ?? `Đưa ra một ví dụ ngắn kiểm tra ${context.skillName.toLowerCase()}.`;
  return {
    title: `Dạy lại nhanh: ${context.skillName}`,
    objective: `Sau hoạt động, học sinh mô tả được cách làm và vận dụng ${context.skillName.toLowerCase()} trong một bài tương tự.`,
    durationMinutes: duration,
    group: { skillId: context.skillId, skillName: context.skillName, studentCount: context.studentCount },
    agenda: [
      { minutes: launch, activity: "Gợi nhớ và dự đoán", teacherMove: "Đưa một ví dụ trực quan, yêu cầu từng em nói bước đầu tiên thay vì nêu đáp án." },
      { minutes: model, activity: "Làm mẫu có giải thích", teacherMove: `Làm rõ ${context.description.toLowerCase()} và dừng sau mỗi bước để hỏi “vì sao?”.` },
      { minutes: practice, activity: "Luyện tập theo cặp", teacherMove: "Cho học sinh giải một bài ngắn, đổi vai giải thích và kiểm tra lẫn nhau." },
      { minutes: 2, activity: "Phiếu thoát", teacherMove: "Thu một câu trả lời cá nhân để quyết định quay lại bài chính hay hỗ trợ thêm." },
    ],
    workedExample: example,
    checks: ["Học sinh có gọi tên đúng bước cần thực hiện không?", "Học sinh có giải thích được lý do của bước đó không?", "Học sinh có làm được bài đổi số liệu mà không cần nhắc không?"],
    differentiation: {
      support: context.commonMisconceptions[0] ? `Dùng sơ đồ hoặc vật mẫu để xử lý lỗi: ${context.commonMisconceptions[0]}` : "Cho sẵn khung từng bước và một ví dụ có số nhỏ.",
      extension: "Yêu cầu học sinh tự tạo một bài tương tự và giải thích cách kiểm tra kết quả.",
    },
    citations: [context.skillId],
  };
}
