import graph from "../../../knowledge-graph/output/knowledge_graph.json";
import KnowledgeGraph, { type Edge, type Skill } from "./KnowledgeGraph";

export default function KnowledgeBasePage() {
  return (
    <main className="shell page kg-page">
      <div className="page-heading kg-title">
        <div>
          <div className="eyebrow">Knowledge Base · GDPT 2018</div>
          <h1>Bản đồ tri thức</h1>
          <p>Khám phá các chuỗi kiến thức Toán lớp 6–9 dẫn tới năng lực cần có của học sinh lớp 9.</p>
        </div>
        <div className="kg-summary"><strong>{graph.skills.length}</strong><span>kỹ năng</span><strong>{graph.edges.length}</strong><span>quan hệ</span></div>
      </div>
      <KnowledgeGraph skills={graph.skills as Skill[]} edges={graph.edges as Edge[]} />
    </main>
  );
}
