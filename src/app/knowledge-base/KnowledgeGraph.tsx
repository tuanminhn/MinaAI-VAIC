"use client";

import cytoscape, { type Core, type ElementDefinition, type StylesheetJson } from "cytoscape";
import dagre from "cytoscape-dagre";
import { useEffect, useMemo, useRef, useState } from "react";
import { neighborhood, RELATIONSHIPS, statusLabel, TOPICS, topicOf, type TopicKey, type ViewMode } from "./graphConfig";

cytoscape.use(dagre);

export type Skill = { id: string; code: string; canonical_name: string; grade: number; domain: string; subdomain?: string; description: string; mastery_threshold: number; review_status: string; provenance: Array<{ book_id: string; pdf_pages: number[]; lesson: string }> };
export type Edge = { source_skill_id: string; target_skill_id: string; relationship_type: string; evidence: string; confidence: number };

const truncate = (value: string, length = 38) => value.length > length ? `${value.slice(0, length - 1)}…` : value;

export default function KnowledgeGraph({ skills, edges }: { skills: Skill[]; edges: Edge[] }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [view, setView] = useState<ViewMode>("roadmap");
  const [expanded, setExpanded] = useState<Set<TopicKey>>(new Set());
  const [collapsedTree, setCollapsedTree] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [relations, setRelations] = useState<Set<string>>(new Set(["prerequisite"]));
  const selected = skills.find((skill) => skill.id === selectedId) ?? null;

  const filteredSkills = useMemo(() => skills.filter((skill) => {
    const text = `${skill.canonical_name} ${skill.code}`.toLocaleLowerCase("vi");
    return (grade === "all" || skill.grade === Number(grade)) && (topic === "all" || topicOf(skill) === topic) &&
      (status === "all" || skill.review_status === status) && text.includes(query.trim().toLocaleLowerCase("vi"));
  }), [grade, query, skills, status, topic]);
  const filteredIds = useMemo(() => new Set(filteredSkills.map((skill) => skill.id)), [filteredSkills]);

  const displaySkills = useMemo(() => view === "full" ? filteredSkills : filteredSkills.filter((skill) => expanded.has(topicOf(skill))), [expanded, filteredSkills, view]);
  const displayIds = useMemo(() => new Set(displaySkills.map((skill) => skill.id)), [displaySkills]);
  const topicCounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    const countableSkills = skills.filter((skill) => {
      const text = `${skill.canonical_name} ${skill.code}`.toLocaleLowerCase("vi");
      return (grade === "all" || skill.grade === Number(grade)) &&
        (status === "all" || skill.review_status === status) && text.includes(normalizedQuery);
    });
    return Object.fromEntries(TOPICS.map((item) => [item.id, countableSkills.filter((skill) => topicOf(skill) === item.id).length]));
  }, [grade, query, skills, status]);

  const graphElements = useMemo<ElementDefinition[]>(() => {
    const topicNodes = view === "roadmap" ? TOPICS.filter((item) => topic === "all" || item.id === topic).map((item) => ({
      data: { id: `topic:${item.id}`, label: `${item.label}\n${topicCounts[item.id]} kỹ năng · ${expanded.has(item.id) ? "Thu gọn" : "Mở rộng"}`, kind: "topic" },
    })) : [];
    const nodes = displaySkills.map((skill) => ({ data: { id: skill.id, label: `${truncate(skill.canonical_name)}\nToán ${skill.grade} · ${TOPICS.find((item) => item.id === topicOf(skill))?.label}`, status: skill.review_status, kind: "skill" } }));
    const graphEdges = edges.filter((edge) => relations.has(edge.relationship_type) && displayIds.has(edge.source_skill_id) && displayIds.has(edge.target_skill_id))
      .map((edge, index) => ({ data: { id: `e:${index}:${edge.source_skill_id}`, source: edge.source_skill_id, target: edge.target_skill_id, relationship: edge.relationship_type } }));
    const membership = view === "roadmap" ? displaySkills.map((skill) => ({ data: { id: `member:${skill.id}`, source: `topic:${topicOf(skill)}`, target: skill.id, relationship: "membership" } })) : [];
    return [...topicNodes, ...nodes, ...membership, ...graphEdges];
  }, [displayIds, displaySkills, edges, expanded, relations, topic, topicCounts, view]);

  useEffect(() => {
    if (!canvasRef.current || view === "tree") return;
    const stylesheet: StylesheetJson = [
      { selector: "node", style: { label: "data(label)", width: 176, height: 76, shape: "round-rectangle", "background-color": "#fff", "border-color": "#a9beb6", "border-width": 2, color: "#1e302a", "font-size": 12, "font-weight": 650, "text-wrap": "wrap", "text-max-width": "150px", "text-valign": "center", "text-halign": "center", "line-height": 1.35, "overlay-opacity": 0 } },
      { selector: "node[kind = 'topic']", style: { width: 210, height: 100, "background-color": "#eaf4f0", "border-color": "#317b67", "border-width": 2, "font-size": 14, "font-weight": 750 } },
      { selector: "node[status = 'pending']", style: { "border-color": "#bd853f", "border-style": "dashed" } },
      { selector: "node[status = 'draft']", style: { "border-color": "#9aa5a0", "border-style": "dotted" } },
      { selector: "node:selected", style: { "background-color": "#17684f", "border-color": "#0d4937", "border-width": 4, color: "#fff" } },
      { selector: "edge", style: { width: 2, "line-color": "#317b67", "target-arrow-color": "#317b67", "target-arrow-shape": "triangle", "curve-style": "taxi", "taxi-direction": "rightward", "taxi-turn": 28, opacity: .7, "arrow-scale": .8 } },
      { selector: "edge[relationship = 'supporting']", style: { "line-color": "#6682a7", "target-arrow-color": "#6682a7", "line-style": "dashed" } },
      { selector: "edge[relationship = 'part_of']", style: { "line-color": "#9a8260", "target-arrow-color": "#9a8260", "line-style": "dotted" } },
      { selector: "edge[relationship = 'membership']", style: { "line-color": "#cbd9d4", "target-arrow-shape": "none", "line-style": "dotted", opacity: .55 } },
      { selector: ".kg-hidden", style: { display: "none" } },
      { selector: ".kg-highlight", style: { width: 4, opacity: 1, "line-color": "#17684f", "target-arrow-color": "#17684f", "z-index": 20 } },
    ];
    const cy = cytoscape({ container: canvasRef.current, elements: graphElements, style: stylesheet, minZoom: .35, maxZoom: 2.5, wheelSensitivity: .16, selectionType: "single" });
    cyRef.current = cy;
    cy.on("tap", "node[kind = 'topic']", (event) => toggleTopic(event.target.id().replace("topic:", "") as TopicKey));
    cy.on("tap", "node[kind = 'skill']", (event) => { setSelectedId(event.target.id()); setFocusMode(true); });
    cy.layout({ name: "dagre", rankDir: "LR", rankSep: view === "full" ? 105 : 125, nodeSep: 42, edgeSep: 18, padding: 50, animate: true, animationDuration: 450, fit: true } as never).run();
    return () => { cy.destroy(); cyRef.current = null; };
  // Selection intentionally excluded: focusing never reruns the layout.
  }, [graphElements, view]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass("kg-hidden kg-highlight");
      cy.$(":selected").unselect();
      if (!selectedId || !focusMode || !cy.getElementById(selectedId).length) return;
      const ids = neighborhood(selectedId, edges);
      cy.nodes().forEach((node) => { if (node.data("kind") === "skill" && !ids.has(node.id())) node.addClass("kg-hidden"); });
      cy.edges().forEach((edge) => { if (edge.source().hasClass("kg-hidden") || edge.target().hasClass("kg-hidden")) edge.addClass("kg-hidden"); else edge.addClass("kg-highlight"); });
      cy.getElementById(selectedId).select();
    });
    if (focusMode && selectedId) cy.animate({ fit: { eles: cy.elements().not(".kg-hidden"), padding: 70 }, duration: 350 });
  }, [edges, focusMode, selectedId]);

  function toggleTopic(id: TopicKey) { setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function selectSkill(id: string) { const skill = skills.find((item) => item.id === id); if (!skill) return; setExpanded((current) => new Set(current).add(topicOf(skill))); setSelectedId(id); setFocusMode(true); setView("roadmap"); }
  function runSearch() { const match = filteredSkills[0]; if (match) selectSkill(match.id); }
  function reset() { setQuery(""); setGrade("all"); setTopic("all"); setStatus("all"); setRelations(new Set(["prerequisite"])); setExpanded(new Set()); setSelectedId(null); setFocusMode(false); setView("roadmap"); }
  const incoming = selected ? edges.filter((edge) => edge.target_skill_id === selected.id) : [];
  const outgoing = selected ? edges.filter((edge) => edge.source_skill_id === selected.id) : [];

  return <>
    <section className="kg-toolbar" aria-label="Bộ lọc đồ thị">
      <label className="kg-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runSearch()} placeholder="Tìm theo tên hoặc mã kỹ năng"/><button onClick={runSearch} aria-label="Tìm">Tìm</button></label>
      <div className="kg-grade-filter" role="group" aria-label="Lọc theo lớp">
        {(["all", "6", "7", "8", "9"] as const).map((item) => <button key={item} type="button" className={grade === item ? "active" : ""} aria-pressed={grade === item} onClick={() => { setGrade(item); setSelectedId(null); setFocusMode(false); }}>{item === "all" ? "Tất cả" : `Lớp ${item}`}</button>)}
      </div>
      <select value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="Lọc theo chủ đề"><option value="all">Tất cả chủ đề</option>{TOPICS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc theo kiểm duyệt"><option value="all">Mọi trạng thái</option><option value="approved">Đã duyệt</option><option value="pending">Chờ duyệt</option><option value="draft">Chưa hoàn thiện</option></select>
      <div className="kg-view-switch" aria-label="Chế độ xem">{([['roadmap','Lộ trình'],['tree','Cây kỹ năng'],['full','Bản đồ đầy đủ']] as const).map(([id,label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setFocusMode(false); }}>{label}</button>)}</div>
      <button className="kg-reset" onClick={reset}>↺ Reset</button>
    </section>
    <div className={`kg-workspace ${sidebarOpen ? "" : "sidebar-closed"}`}>
      <aside className="kg-sidebar">
        <div className="kg-side-heading"><strong>Khám phá</strong><button onClick={() => setSidebarOpen(false)} aria-label="Thu gọn sidebar">‹</button></div>
        <span className="kg-section-label">Chủ đề</span>
        {TOPICS.map((item) => <button key={item.id} className={`kg-topic-row ${expanded.has(item.id) ? "active" : ""}`} onClick={() => toggleTopic(item.id)}><i>{item.label[0]}</i><span><strong>{item.label}</strong><small>{topicCounts[item.id]} kỹ năng · 100% đã duyệt</small></span><b>{expanded.has(item.id) ? "−" : "+"}</b></button>)}
        <span className="kg-section-label">Quan hệ hiển thị</span>
        {Object.entries(RELATIONSHIPS).filter(([id]) => id !== "next_skill").map(([id, item]) => <label className="kg-relation-toggle" key={id}><input type="checkbox" checked={relations.has(id)} onChange={() => setRelations((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })}/><i style={{ borderColor: item.color, borderTopStyle: item.style }}/><span>{item.label}</span></label>)}
      </aside>
      {!sidebarOpen && <button className="kg-open-sidebar" onClick={() => setSidebarOpen(true)}>☰ Bộ lọc</button>}
      <section className="kg-canvas-card" aria-label="Knowledge graph Toán THCS">
        <div className="kg-canvas-heading"><div><strong>{focusMode ? "Lộ trình liên quan" : view === "roadmap" ? "Lộ trình Toán THCS" : view === "tree" ? "Cây kỹ năng" : "Bản đồ đầy đủ"}</strong><span>{focusMode ? "Tiên quyết → Kỹ năng đang chọn → Có thể học tiếp" : "Luồng học từ trái sang phải · Click chủ đề để mở rộng"}</span></div><div className="kg-heading-actions"><span>{filteredIds.size}/{skills.length} kỹ năng</span>{focusMode && <button onClick={() => setFocusMode(false)}>Xem toàn bộ graph</button>}</div></div>
        {view === "tree" ? <SkillTree skills={filteredSkills} collapsed={collapsedTree} setCollapsed={setCollapsedTree} onSelect={selectSkill}/> : <div className="kg-canvas-wrap"><div ref={canvasRef} className="kg-graph"/><div className="kg-graph-controls"><button onClick={() => cyRef.current?.zoom(cyRef.current.zoom()*1.2)}>+</button><button onClick={() => cyRef.current?.zoom(cyRef.current.zoom()/1.2)}>−</button><button onClick={() => cyRef.current?.fit(undefined, 50)}>Fit</button></div>{view === "roadmap" && expanded.size === 0 && <div className="kg-empty-note"><strong>Bắt đầu từ một chủ đề</strong><span>Chọn nhóm bên trái hoặc click vào node để xem các kỹ năng.</span></div>}<span className="kg-hint">Kéo để di chuyển · Cuộn để thu phóng</span></div>}
      </section>
      <DetailPanel selected={selected} skills={skills} incoming={incoming} outgoing={outgoing} onSelect={selectSkill}/>
    </div>
  </>;
}

function SkillTree({ skills, collapsed, setCollapsed, onSelect }: { skills: Skill[]; collapsed: Set<string>; setCollapsed: (value: Set<string>) => void; onSelect: (id: string) => void }) {
  const toggle = (id: string) => { const next = new Set(collapsed); if (next.has(id)) next.delete(id); else next.add(id); setCollapsed(next); };
  return <div className="kg-tree"><div className="kg-tree-root"><b>∑</b><span><strong>Toán THCS</strong><small>{skills.length} kỹ năng · Lớp 6–9</small></span></div>{[6,7,8,9].map((grade) => { const gradeSkills = skills.filter((skill) => skill.grade === grade); if (!gradeSkills.length) return null; return <div className="kg-tree-grade" key={grade}><button onClick={() => toggle(`g${grade}`)}><b>{collapsed.has(`g${grade}`) ? "›" : "⌄"}</b> Lớp {grade} <span>{gradeSkills.length}</span></button>{!collapsed.has(`g${grade}`) && TOPICS.map((topic) => { const items = gradeSkills.filter((skill) => topicOf(skill) === topic.id); if (!items.length) return null; const key = `g${grade}:${topic.id}`; return <div className="kg-tree-topic" key={key}><button onClick={() => toggle(key)}><b>{collapsed.has(key) ? "›" : "⌄"}</b>{topic.label}<span>{items.length}</span></button>{!collapsed.has(key) && <div>{items.map((skill) => <button className="kg-tree-skill" key={skill.id} onClick={() => onSelect(skill.id)}><i/> <span>{skill.canonical_name}<small>{skill.code}</small></span><b>›</b></button>)}</div>}</div>; })}</div>; })}</div>;
}

function DetailPanel({ selected, skills, incoming, outgoing, onSelect }: { selected: Skill | null; skills: Skill[]; incoming: Edge[]; outgoing: Edge[]; onSelect: (id: string) => void }) {
  if (!selected) return <aside className="kg-detail kg-detail-empty"><div>↖</div><h2>Chọn một kỹ năng</h2><p>Click vào chủ đề, sau đó chọn kỹ năng để xem tiên quyết và bước học tiếp theo.</p></aside>;
  const relationList = (items: Edge[], incomingDirection: boolean) => items.map((edge) => { const id = incomingDirection ? edge.source_skill_id : edge.target_skill_id; const skill = skills.find((item) => item.id === id); return skill ? <button key={`${edge.source_skill_id}:${edge.target_skill_id}:${edge.relationship_type}`} onClick={() => onSelect(id)}><i className={edge.relationship_type}/><span><strong>{skill.canonical_name}</strong><small>Toán {skill.grade} · {RELATIONSHIPS[edge.relationship_type as keyof typeof RELATIONSHIPS]?.label ?? edge.relationship_type}</small></span><b>›</b></button> : null; });
  return <aside className="kg-detail" aria-live="polite"><div className="kg-detail-top"><span className="pill">Toán {selected.grade} · {TOPICS.find((item) => item.id === topicOf(selected))?.label}</span><span className={`kg-status ${selected.review_status}`}>● {statusLabel(selected.review_status)}</span></div><h2>{selected.canonical_name}</h2><code>{selected.code}</code><p>{selected.description}</p><div className="kg-mastery"><span>Ngưỡng thành thạo</span><strong>{Math.round(selected.mastery_threshold*100)}%</strong><div><i style={{width:`${selected.mastery_threshold*100}%`}}/></div></div><div className="kg-meta"><span>Nguồn chương trình</span><strong>{selected.provenance[0]?.lesson ?? "Chưa cập nhật"}</strong><small>{selected.provenance[0]?.book_id}{selected.provenance[0]?.pdf_pages.length ? ` · Trang ${selected.provenance[0].pdf_pages.join(", ")}` : ""}</small></div><div className="kg-relations"><span>Tiên quyết trực tiếp · {incoming.length}</span>{relationList(incoming,true)}<span className="kg-next-label">Có thể học tiếp · {outgoing.length}</span>{relationList(outgoing,false)}</div></aside>;
}
