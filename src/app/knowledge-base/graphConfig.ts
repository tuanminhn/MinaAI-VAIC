import type { Edge, Skill } from "./KnowledgeGraph";

export type TopicKey = "numbers" | "algebra" | "geometry" | "data";
export type ViewMode = "roadmap" | "tree" | "full";

export const TOPICS: Array<{ id: TopicKey; label: string; description: string }> = [
  { id: "numbers", label: "Số học", description: "Số, phân số và phép tính" },
  { id: "algebra", label: "Đại số", description: "Biểu thức, hàm số và phương trình" },
  { id: "geometry", label: "Hình học", description: "Hình, đo lường và chứng minh" },
  { id: "data", label: "Dữ liệu & xác suất", description: "Thống kê, dữ liệu và biến cố" },
];

export const RELATIONSHIPS = {
  prerequisite: { label: "Tiên quyết bắt buộc", color: "#317b67", style: "solid" },
  supporting: { label: "Hỗ trợ", color: "#6682a7", style: "dashed" },
  part_of: { label: "Cùng chủ đề", color: "#9a8260", style: "dotted" },
  next_skill: { label: "Có thể học tiếp", color: "#317b67", style: "dashed" },
} as const;

export function topicOf(skill: Skill): TopicKey {
  if (skill.domain === "Numbers") return "numbers";
  if (skill.domain === "Geometry") return "geometry";
  if (skill.domain === "Statistics" || skill.domain === "Probability") return "data";
  return "algebra";
}

export function statusLabel(status: string) {
  if (status === "approved") return "Đã duyệt";
  if (status === "pending") return "Chờ duyệt";
  return "Chưa hoàn thiện";
}

export function neighborhood(skillId: string, edges: Edge[]) {
  const prerequisiteEdges = edges.filter((edge) => edge.relationship_type === "prerequisite");
  const ids = new Set([skillId]);
  let frontier = new Set([skillId]);
  for (let depth = 0; depth < 2; depth += 1) {
    const next = new Set<string>();
    prerequisiteEdges.forEach((edge) => {
      if (frontier.has(edge.target_skill_id)) next.add(edge.source_skill_id);
    });
    next.forEach((id) => ids.add(id));
    frontier = next;
  }
  prerequisiteEdges.forEach((edge) => {
    if (edge.source_skill_id === skillId) ids.add(edge.target_skill_id);
  });
  return ids;
}
