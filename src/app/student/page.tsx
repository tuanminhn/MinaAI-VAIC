"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Diagnosis } from "@/lib/contracts";

type DemoQuestion = { id: string; stem: string; options: { id: string; content: string }[] };
type StudentIdentity = { id: string; displayName: string; studentNumber: string };
type ExplanationResult = {
  feedback: string;
  concept: string;
  steps: string[];
  selfCheckQuestion: string;
  citations: string[];
  ai: { mode: "llm" | "fallback"; reason?: string };
};
type DemoPayload = {
  classroom: { name: string; code: string };
  assignment: { id: string; title: string };
  questions: DemoQuestion[];
};

export default function StudentPage() {
  const [data, setData] = useState<DemoPayload | null>(null);
  const [student, setStudent] = useState<StudentIdentity | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);
  const [explanationBusy, setExplanationBusy] = useState("");
  const [explanations, setExplanations] = useState<Record<string, ExplanationResult>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/demo", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error ?? "Không tải được dữ liệu demo");
        return response.json();
      })
      .then((payload: DemoPayload) => setData(payload))
      .catch((reason) => setError(reason.message));
  }, []);

  function resetStudent() {
    setStudent(null);
    setAnswers({});
    setSubmitted(false);
    setDiagnosis(null);
    setExplanations({});
    setError("");
  }

  async function requestExplanation(questionId: string) {
    if (!data || !student || !submitted) return;
    setExplanationBusy(questionId);
    setError("");
    try {
      const response = await fetch("/api/ai/explanation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: student.id, assignmentId: data.assignment.id, questionId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Chưa tạo được giải thích");
      setExplanations((current) => ({ ...current, [questionId]: result }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa tạo được giải thích");
    } finally {
      setExplanationBusy("");
    }
  }

  async function identifyStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayName.trim() || !studentNumber.trim()) return setError("Vui lòng nhập đầy đủ họ tên và số báo danh.");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName, studentNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error("Không lưu được thông tin học sinh.");
      setStudent(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function submitInteractive() {
    if (!data || !student) return;
    const selected = Object.entries(answers);
    if (selected.length !== data.questions.length) return setError("Hãy trả lời tất cả câu hỏi trước khi nộp bài.");
    setBusy(true);
    setError("");
    try {
      let latestDiagnosis: Diagnosis | null = null;
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
        const result = await response.json() as Diagnosis & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Không lưu được câu trả lời");
        latestDiagnosis = result;
      }
      setDiagnosis(latestDiagnosis);
      setSubmitted(true);
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

      {data && !student && (
        <section className="student-entry">
          <div className="entry-copy">
            <span className="pill blue">Bắt đầu bài học</span>
            <h2>Trước tiên, cho Mina biết em là ai.</h2>
            <p>Thông tin này giúp giáo viên nhận đúng bài làm của em trong danh sách lớp.</p>
            <div className="entry-note">
              <strong>{data.assignment.title}</strong>
              <span>{data.questions.length} câu · Khoảng 5–10 phút</span>
            </div>
          </div>
          <form className="identity-form" onSubmit={identifyStudent}>
            <label>
              <span>Họ và tên</span>
              <input
                autoComplete="name"
                maxLength={80}
                placeholder="Ví dụ: Nguyễn Minh Anh"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <label>
              <span>Số báo danh</span>
              <input
                maxLength={40}
                placeholder="Nhập tự do để thử demo"
                value={studentNumber}
                onChange={(event) => setStudentNumber(event.target.value)}
              />
            </label>
            <button className="button primary" disabled={busy || !displayName.trim() || !studentNumber.trim()}>
              {busy ? "Đang lưu thông tin..." : "Tiếp tục làm bài"}
            </button>
            <small>Có thể nhập thông tin bất kỳ để thử demo, không cần khớp danh sách lớp.</small>
          </form>
        </section>
      )}

      {data && student && submitted && diagnosis && (
        <section className="student-results" aria-live="polite">
          <header className="results-hero">
            <div className="success-mark" aria-hidden="true">✓</div>
            <div>
              <span className="pill">Đã nộp và khóa kết quả</span>
              <h2>Kết quả bài diagnostic</h2>
              <p>Em làm đúng {diagnosis.evidence.filter((item) => item.isCorrect).length}/{diagnosis.evidence.length} câu. Những câu sai có phần giải thích từ Mina để em biết mình cần xem lại điều gì.</p>
            </div>
            <div className="result-score"><strong>{diagnosis.evidence.length ? Math.round(diagnosis.evidence.filter((item) => item.isCorrect).length / diagnosis.evidence.length * 100) : 0}%</strong><span>Chính xác</span></div>
          </header>

          <div className="submission-details">
            <div><span>Học sinh</span><strong>{student.displayName}</strong></div>
            <div><span>Số báo danh</span><strong>{student.studentNumber}</strong></div>
            <div><span>Bài học</span><strong>{data.assignment.title}</strong></div>
            <div><span>Trạng thái</span><strong>Đã gửi giáo viên</strong></div>
          </div>

          <div className="answer-results">
            {data.questions.map((question, index) => {
              const evidence = diagnosis.evidence.find((item) => item.questionId === question.id);
              if (!evidence) return null;
              const correctContent = question.options.find((option) => option.id === evidence.correctOptionId)?.content;
              const explanation = explanations[question.id];
              return (
                <article className={`answer-result ${evidence.isCorrect ? "correct" : "incorrect"}`} key={question.id}>
                  <div className="answer-result-status" aria-label={evidence.isCorrect ? "Đúng" : "Chưa đúng"}>{evidence.isCorrect ? "✓" : "!"}</div>
                  <div className="answer-result-body">
                    <div className="answer-result-heading"><strong>Câu {index + 1}. {question.stem}</strong><span>{evidence.isCorrect ? "Đúng" : "Chưa đúng"}</span></div>
                    <p><b>Em đã chọn:</b> {evidence.selectedOptionId}. {evidence.selectedContent}</p>
                    {!evidence.isCorrect && <p className="correct-answer"><b>Đáp án phù hợp:</b> {evidence.correctOptionId}. {correctContent}</p>}
                    {!evidence.isCorrect && (
                      <button className="button secondary" disabled={explanationBusy === question.id} onClick={() => requestExplanation(question.id)}>
                        {explanationBusy === question.id ? "Mina đang giải thích..." : explanation ? "Xem lại giải thích của Mina" : "✨ Nhờ Mina giải thích"}
                      </button>
                    )}
                    {explanation && (
                      <aside className="answer-explanation">
                        <div><strong>Mina giải thích</strong><span>{explanation.ai.mode === "llm" ? "AI trực tuyến" : "Bản dự phòng có căn cứ"}</span></div>
                        <p>{explanation.feedback}</p>
                        <ol>{explanation.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                        <section><span>Em tự kiểm tra:</span><strong>{explanation.selfCheckQuestion}</strong></section>
                      </aside>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="results-actions"><button className="button secondary" onClick={resetStudent}>Quay lại trang bắt đầu</button></div>
        </section>
      )}

      {data && student && !submitted && (
        <section className="card stack student-test">
            <header className="test-header">
              <div className="test-title">
                <span className="pill blue">Bài diagnostic</span>
                <h2>{data.assignment.title}</h2>
                <p>Hoàn thành tất cả câu hỏi rồi nộp bài cho giáo viên.</p>
              </div>
              <div className="test-candidate">
                <div><span>Thí sinh</span><strong>{student.displayName}</strong></div>
                <div><span>Số báo danh</span><strong>{student.studentNumber}</strong></div>
                <button onClick={resetStudent}>Đổi thí sinh</button>
              </div>
            </header>
            <div className="test-progress">
              <span>Tiến độ</span>
              <strong>{Object.keys(answers).length}/{data.questions.length} câu đã chọn</strong>
              <div><i style={{ width: `${data.questions.length ? Object.keys(answers).length / data.questions.length * 100 : 0}%` }} /></div>
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
            <button className="button primary" onClick={submitInteractive} disabled={busy || Object.keys(answers).length !== data.questions.length}>
              {busy ? "Đang nộp bài..." : "Nộp bài cho giáo viên"}
            </button>
        </section>
      )}
    </main>
  );
}
