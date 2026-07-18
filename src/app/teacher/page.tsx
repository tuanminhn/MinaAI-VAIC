"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentSummary } from "@/lib/contracts";

type Dashboard = {
  classroom: { name: string; studentCount: number };
  freshness: string;
  metrics: { diagnosed: number; mastered: number; insufficient: number; completed: number };
  students: StudentSummary[];
};

const labels: Record<string, string> = {
  diagnosed: "Cần củng cố",
  mastered: "Đã thành thạo",
  insufficient_evidence: "Cần thêm dữ liệu",
  outside_mvp_scope: "Ngoài phạm vi",
};

function skillLabel(skillId: string | null) {
  if (skillId === "MATH.G6.FRACTION.COMMON_DENOMINATOR") return "Quy đồng mẫu số";
  if (skillId === "MATH.G6.FRACTION.ADD_SUBTRACT") return "Cộng trừ phân số";
  return skillId ? skillId.split(".").at(-1)?.replaceAll("_", " ") : "—";
}

export default function TeacherPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [selected, setSelected] = useState<StudentSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/dashboard", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Không tải được dashboard");
      setData(result);
      setSelected((current) => current ? result.students.find((item: StudentSummary) => item.id === current.id) ?? null : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra");
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  async function action(endpoint: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Thao tác thất bại");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  const visibleStudents = data?.students.filter((student) => {
    if (filter === "all") return true;
    if (filter === "pending") return !student.diagnosis;
    return student.diagnosis?.status === filter;
  }) ?? [];

  const completion = data?.classroom.studentCount
    ? Math.round((data.metrics.completed / data.classroom.studentCount) * 100)
    : 0;

  return (
    <main className="teacher-workspace">
      <section className="teacher-header">
        <div className="shell teacher-header-inner">
          <div>
            <div className="teacher-breadcrumb">Lớp học <span>/</span> Toán 7 <span>/</span> Diagnostic</div>
            <div className="teacher-title-row">
              <div>
                <h1>{data?.classroom.name ?? "Lớp 7A demo"}</h1>
                <p>Diagnostic tổng hợp Toán lớp 9 · Đang diễn ra</p>
              </div>
              <span className="live-badge"><i /> Đang nhận bài</span>
            </div>
          </div>
          <div className="teacher-actions">
            <button className="button secondary" disabled={busy} onClick={() => action("/api/demo/reset")}>Đặt lại dữ liệu</button>
            <button className="button primary" disabled={busy} onClick={() => action("/api/demo/run")}>{busy ? "Đang tạo..." : "Tạo dữ liệu mẫu"}</button>
          </div>
        </div>
      </section>

      <div className="shell teacher-content">

      {error && <div className="notice error">{error}</div>}

      <section className="teacher-metrics" aria-label="Tổng quan lớp">
        <article className="teacher-metric primary-metric">
          <div><span>Tiến độ lớp</span><strong>{completion}%</strong></div>
          <div className="progress"><span style={{ width: `${completion}%` }} /></div>
          <small>{data?.metrics.completed ?? 0} trên {data?.classroom.studentCount ?? 0} học sinh đã nộp</small>
        </article>
        <article className="teacher-metric alert-metric"><span>Cần hỗ trợ</span><strong>{data?.metrics.diagnosed ?? 0}</strong><small>Có nguyên nhân rõ ràng</small></article>
        <article className="teacher-metric"><span>Cần xem thêm</span><strong>{data?.metrics.insufficient ?? 0}</strong><small>Chưa đủ bằng chứng</small></article>
        <article className="teacher-metric success-metric"><span>Đã nắm vững</span><strong>{data?.metrics.mastered ?? 0}</strong><small>Đạt mục tiêu hiện tại</small></article>
      </section>

      <div className="teacher-grid">
        <section className="teacher-list-panel">
          <div className="panel-header">
            <div>
              <h2>Danh sách học sinh</h2>
              <p>Ưu tiên theo mức độ cần hỗ trợ</p>
            </div>
            <small>Cập nhật lúc {data ? new Date(data.freshness).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}</small>
          </div>
          <div className="teacher-filters" aria-label="Lọc danh sách">
            {[
              ["all", "Tất cả"], ["diagnosed", "Cần hỗ trợ"], ["insufficient_evidence", "Cần xem thêm"],
              ["mastered", "Đã nắm vững"], ["pending", "Chưa nộp"],
            ].map(([value, copy]) => (
              <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{copy}</button>
            ))}
          </div>
          {!visibleStudents.length ? (
            <div className="empty">Chưa có học sinh trong trạng thái này.</div>
          ) : (
            <div className="teacher-table">
              <div className="teacher-table-head"><span>Học sinh</span><span>Kỹ năng cần chú ý</span><span>Trạng thái</span><span /></div>
              {visibleStudents.map((student) => (
                <button className={`teacher-student-row ${selected?.id === student.id ? "selected" : ""}`} key={student.id} onClick={() => setSelected(student)}>
                  <span className="student-cell"><i>{student.displayName.charAt(0)}</i><span><strong>{student.displayName}</strong><small>SBD {student.studentNumber ?? "—"}</small></span></span>
                  <span className="skill-cell">{skillLabel(student.diagnosis?.rootCauseSkillId ?? null)}</span>
                  <span><span className={`status-badge ${student.diagnosis?.status ?? "pending"}`}>{student.diagnosis ? labels[student.diagnosis.status] : "Chưa nộp"}</span></span>
                  <span className="row-arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="evidence-panel">
          {!selected?.diagnosis ? (
            <div className="evidence-empty"><span>↗</span><h3>Chọn một học sinh</h3><p>Xem kết quả chẩn đoán, bằng chứng và hành động đề xuất tại đây.</p></div>
          ) : (
            <>
              <div className="evidence-student">
                <div className="evidence-avatar">{selected.displayName.charAt(0)}</div>
                <div><h2>{selected.displayName}</h2><p>Số báo danh {selected.studentNumber ?? "—"}</p></div>
              </div>
              <div className="diagnosis-summary">
                <div><span>Kết luận của Mina</span><strong>{labels[selected.diagnosis.status]}</strong></div>
                <div className="confidence-ring"><strong>{Math.round(selected.diagnosis.confidence * 100)}%</strong><span>Tin cậy</span></div>
              </div>
              <div className="root-cause-box"><span>Kỹ năng nền cần chú ý</span><strong>{skillLabel(selected.diagnosis.rootCauseSkillId)}</strong></div>
              <div className="evidence-section">
                <div className="evidence-heading"><h3>Bằng chứng</h3><span>{selected.diagnosis.evidence.length} câu trả lời</span></div>
                {selected.diagnosis.evidence.map((item) => (
                  <div className={`evidence-item ${item.isCorrect ? "correct" : "incorrect"}`} key={item.questionId}>
                    <i>{item.isCorrect ? "✓" : "!"}</i>
                    <div><strong>{item.stem}</strong><span>{item.misconception ?? `Đã chọn ${item.selectedContent}`}</span></div>
                  </div>
                ))}
              </div>
              {selected.diagnosis.status === "diagnosed" && (
                <div className="recommendation-box"><span>Hành động đề xuất</span><strong>Giao gói củng cố 10 phút</strong><p>Tập trung vào quy đồng mẫu số trước khi quay lại bài chính.</p><button className="button primary" disabled={busy || selected.remediationStatus === "assigned"} onClick={() => action("/api/remediation", { studentId: selected.id, pathId: selected.diagnosis?.recommendedPathId })}>{selected.remediationStatus === "assigned" ? "✓ Đã giao cho học sinh" : "Giao bài củng cố"}</button></div>
              )}
            </>
          )}
        </aside>
      </div>
      </div>
    </main>
  );
}
