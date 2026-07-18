"use client";

import { useEffect, useMemo, useState } from "react";
import type { Diagnosis } from "@/lib/contracts";

type DemoQuestion = { id: string; stem: string; options: { id: string; content: string }[] };
type DemoStudent = { id: string; displayName: string; scenario: string; presetAnswers: Record<string, string> };
type DemoPayload = {
  classroom: { name: string; code: string };
  assignment: { id: string; title: string };
  students: DemoStudent[];
  questions: DemoQuestion[];
};

const statusCopy: Record<string, { title: string; body: string }> = {
  diagnosed: { title: "Đã tìm thấy kỹ năng cần củng cố", body: "Mina đề xuất một bài luyện ngắn trước khi em quay lại bài chính." },
  mastered: { title: "Em đang làm rất tốt", body: "Các bằng chứng hiện tại cho thấy em đã nắm được kỹ năng này." },
  insufficient_evidence: { title: "Cần thêm một chút thông tin", body: "Mina chưa kết luận vội. Em sẽ nhận thêm một câu hỏi thăm dò." },
  outside_mvp_scope: { title: "Nội dung nằm ngoài phạm vi hiện tại", body: "Giáo viên sẽ hỗ trợ em ở bước tiếp theo." },
};

export default function StudentPage() {
  const [data, setData] = useState<DemoPayload | null>(null);
  const [studentId, setStudentId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/demo", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error ?? "Không tải được dữ liệu demo");
        return response.json();
      })
      .then((payload: DemoPayload) => {
        setData(payload);
        setStudentId(payload.students[0]?.id ?? "");
      })
      .catch((reason) => setError(reason.message));
  }, []);

  const student = useMemo(() => data?.students.find((item) => item.id === studentId), [data, studentId]);

  function changeStudent(id: string) {
    setStudentId(id);
    setAnswers({});
    setDiagnosis(null);
    setError("");
  }

  async function runPreset() {
    if (!student) return;
    setBusy(true);
    setError("");
    setAnswers(student.presetAnswers);
    try {
      const response = await fetch("/api/demo/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Không chạy được kịch bản");
      setDiagnosis(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function submitInteractive() {
    if (!data || !student) return;
    const selected = Object.entries(answers);
    if (!selected.length) return setError("Hãy chọn ít nhất một đáp án.");
    setBusy(true);
    setError("");
    try {
      let latest: Diagnosis | null = null;
      for (const [questionId, optionId] of selected) {
        const response = await fetch("/api/attempts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            eventId: crypto.randomUUID(),
            studentId: student.id,
            assignmentId: data.assignment.id,
            questionId,
            optionId,
            occurredAt: new Date().toISOString(),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Không lưu được câu trả lời");
        latest = result;
      }
      setDiagnosis(latest);
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
          <div className="eyebrow">Góc học tập</div>
          <h1>Chào em!</h1>
          <p>{data ? `${data.classroom.name} · Mã lớp ${data.classroom.code}` : "Đang tải lớp học..."}</p>
        </div>
        <span className="pill">Đã lưu trên máy chủ</span>
      </div>

      {error && <div className="notice error">{error}</div>}
      {!data && !error && <div className="card empty">Đang chuẩn bị bài học...</div>}

      {data && (
        <div className="grid">
          <section className="card stack">
            <div>
              <span className="pill blue">Chọn hồ sơ demo</span>
              <h2 style={{ marginTop: 12 }}>{data.assignment.title}</h2>
              <p className="muted">Chọn một học sinh, trả lời thủ công hoặc chạy kịch bản mẫu.</p>
            </div>
            <div className="tabs">
              {data.students.map((item) => (
                <button key={item.id} className={`tab ${studentId === item.id ? "active" : ""}`} onClick={() => changeStudent(item.id)}>
                  {item.displayName}
                </button>
              ))}
            </div>
            <button className="button secondary" onClick={runPreset} disabled={busy}>
              {busy ? "Đang phân tích..." : `Chạy nhanh kịch bản ${student?.displayName ?? ""}`}
            </button>
          </section>

          <section className="card stack">
            {diagnosis ? (
              <>
                <span className={`pill ${diagnosis.status === "diagnosed" ? "amber" : diagnosis.status === "mastered" ? "" : "blue"}`}>
                  {diagnosis.status}
                </span>
                <h2>{statusCopy[diagnosis.status]?.title}</h2>
                <p className="muted">{statusCopy[diagnosis.status]?.body}</p>
                {diagnosis.status === "diagnosed" && (
                  <div className="notice">
                    Kỹ năng luyện: <strong>Quy đồng mẫu số hai phân số</strong><br />
                    Độ tin cậy: <strong>{Math.round(diagnosis.confidence * 100)}%</strong>
                  </div>
                )}
                <div className="row">
                  <span className="muted">Bằng chứng đã ghi nhận</span>
                  <strong>{diagnosis.evidence.length} câu</strong>
                </div>
              </>
            ) : (
              <div className="empty">Kết quả sẽ xuất hiện ở đây sau khi em hoàn thành bài.</div>
            )}
          </section>

          <section className="card stack" style={{ gridColumn: "1 / -1" }}>
            <div className="row">
              <div>
                <span className="pill">Diagnostic</span>
                <h2 style={{ marginTop: 10 }}>Bài thăm dò ngắn</h2>
              </div>
              <span className="muted">{Object.keys(answers).length}/{data.questions.length} câu đã chọn</span>
            </div>
            {data.questions.map((question, index) => (
              <div className="question" key={question.id}>
                <strong>Câu {index + 1}. {question.stem}</strong>
                <div className="options">
                  {question.options.map((option) => (
                    <label className="option" key={option.id}>
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === option.id}
                        onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      />
                      <span><strong>{option.id}.</strong> {option.content}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button className="button primary" onClick={submitInteractive} disabled={busy || !Object.keys(answers).length}>
              {busy ? "Đang lưu và phân tích..." : "Nộp bài"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
