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

  return (
    <main className="shell page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Teacher intervention dashboard</div>
          <h1>{data?.classroom.name ?? "Lớp 7A demo"}</h1>
          <p>Hôm nay cần giúp ai trước?</p>
        </div>
        <div className="hero-actions" style={{ margin: 0 }}>
          <button className="button secondary" disabled={busy} onClick={() => action("/api/demo/reset")}>Đặt lại</button>
          <button className="button primary" disabled={busy} onClick={() => action("/api/demo/run")}>{busy ? "Đang chạy..." : "Tạo kết quả demo"}</button>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid" aria-label="Tổng quan lớp">
        <div className="metric"><strong>{data?.metrics.completed ?? 0}/{data?.classroom.studentCount ?? 3}</strong><span>Đã hoàn thành</span></div>
        <div className="metric"><strong>{data?.metrics.diagnosed ?? 0}</strong><span>Cần củng cố</span></div>
        <div className="metric"><strong>{data?.metrics.insufficient ?? 0}</strong><span>Cần thêm dữ liệu</span></div>
        <div className="metric"><strong>{data?.metrics.mastered ?? 0}</strong><span>Đã thành thạo</span></div>
      </section>

      <div className="grid">
        <section className="card">
          <div className="row">
            <div>
              <span className="pill">Danh sách ưu tiên</span>
              <h2 style={{ marginTop: 10 }}>Học sinh</h2>
            </div>
            <small className="muted">Cập nhật {data ? new Date(data.freshness).toLocaleTimeString("vi-VN") : "—"}</small>
          </div>
          {!data?.students.some((item) => item.diagnosis) ? (
            <div className="empty">Bấm “Tạo kết quả demo” để chạy ba kịch bản qua diagnostic engine.</div>
          ) : (
            <div className="student-list">
              {data.students.map((student) => (
                <button className="student-item" key={student.id} onClick={() => setSelected(student)} style={{ width: "100%", textAlign: "left", borderLeft: 0, borderRight: 0, borderBottom: 0, background: "transparent" }}>
                  <strong>{student.displayName}</strong>
                  <span>{skillLabel(student.diagnosis?.rootCauseSkillId ?? null)}</span>
                  <span className={`pill ${student.diagnosis?.status === "diagnosed" ? "amber" : student.diagnosis?.status === "mastered" ? "" : "blue"}`}>
                    {student.diagnosis ? labels[student.diagnosis.status] : "Chưa làm"}
                  </span>
                  <span>›</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card stack">
          {!selected?.diagnosis ? (
            <div className="empty">Chọn một học sinh để xem bằng chứng và hành động đề xuất.</div>
          ) : (
            <>
              <div className="row">
                <div><span className="pill blue">Evidence view</span><h2 style={{ marginTop: 10 }}>{selected.displayName}</h2></div>
                <strong>{Math.round(selected.diagnosis.confidence * 100)}%</strong>
              </div>
              <div>
                <small className="muted">Kết luận</small>
                <h3>{labels[selected.diagnosis.status]}</h3>
                <p className="muted">{skillLabel(selected.diagnosis.rootCauseSkillId)}</p>
              </div>
              <div className="stack">
                {selected.diagnosis.evidence.map((item) => (
                  <div className="notice" key={item.questionId}>
                    <strong>{item.isCorrect ? "Đúng" : "Cần xem lại"}: {item.stem}</strong><br />
                    <span>{item.misconception ?? `Đã chọn ${item.selectedContent}`}</span>
                  </div>
                ))}
              </div>
              {selected.diagnosis.status === "diagnosed" && (
                <button className="button primary" disabled={busy || selected.remediationStatus === "assigned"} onClick={() => action("/api/remediation", { studentId: selected.id, pathId: selected.diagnosis?.recommendedPathId })}>
                  {selected.remediationStatus === "assigned" ? "Đã giao bài bù" : "Giao gói bù 10 phút"}
                </button>
              )}
              {selected.remediationStatus && <div className="notice">Trạng thái can thiệp: <strong>{selected.remediationStatus}</strong></div>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
