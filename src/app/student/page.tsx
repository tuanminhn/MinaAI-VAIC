"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Diagnosis } from "@/lib/contracts";

type DemoQuestion = { id: string; stem: string; options: { id: string; content: string }[] };
type StudentIdentity = { id: string; displayName: string; studentNumber: string };
type ExplanationResult = {
  feedback: string; concept: string; steps: string[]; selfCheckQuestion: string; citations: string[];
  ai: { mode: "llm" | "fallback"; reason?: string };
};
type DemoPayload = {
  classroom: { name: string; code: string };
  assignment: { id: string; title: string };
  questions: DemoQuestion[];
};
type StudentPractice = {
  id: string; skillId: string; skillName: string; title: string; objective: string; instructions: string;
  status: "assigned" | "in_progress" | "submitted"; score: number | null; total: number | null;
  questions: { id: string; stem: string; difficulty: string; options: { id: string; content: string }[] }[];
};
type PracticeResult = {
  practiceId: string; score: number; total: number;
  results: { questionId: string; selectedOptionId: string; correctOptionId: string; isCorrect: boolean; explanation: string }[];
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
  const [practices, setPractices] = useState<StudentPractice[]>([]);
  const [activePractice, setActivePractice] = useState<StudentPractice | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const demoResponse = await fetch("/api/demo", { cache: "no-store" });
        if (!demoResponse.ok) throw new Error("Chưa thể tải bài được giao từ máy chủ Mina trong trường.");
        const demo = await demoResponse.json();
        if (!cancelled) setData(demo);
        const sessionResponse = await fetch("/api/student/session", { cache: "no-store" });
        if (sessionResponse.ok && !cancelled) {
          const identity = await sessionResponse.json();
          setStudent(identity);
          const practiceResponse = await fetch("/api/student/practice", { cache: "no-store" });
          if (practiceResponse.ok) setPractices(await practiceResponse.json());
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Chưa thể tải phiên học.");
      }
    }
    void bootstrap();
    return () => { cancelled = true; };
  }, []);

  async function loadPractices() {
    const response = await fetch("/api/student/practice", { cache: "no-store" });
    if (response.status === 401) throw new Error("Phiên đăng nhập đã hết hạn. Em hãy đăng nhập lại bằng SBD.");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Chưa tải được bài luyện tập.");
    setPractices(result);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentNumber.trim()) return setError("Vui lòng nhập số báo danh.");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/student/session", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, studentNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Không đăng nhập được.");
      setStudent(result);
      await loadPractices();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không đăng nhập được.");
    } finally {
      setBusy(false);
    }
  }

  async function logoutStudent() {
    await fetch("/api/student/session", { method: "DELETE" });
    setStudent(null); setDisplayName(""); setStudentNumber(""); setAnswers({}); setSubmitted(false); setDiagnosis(null);
    setExplanations({}); setPractices([]); setActivePractice(null); setPracticeAnswers({}); setPracticeResult(null); setError("");
  }

  async function requestExplanation(questionId: string) {
    if (!student || !data) return;
    setExplanationBusy(questionId); setError("");
    try {
      const response = await fetch("/api/ai/explanation", {
        method: "POST", headers: { "content-type": "application/json" },
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

  async function submitInteractive() {
    if (!data || !student) return;
    const selected = Object.entries(answers);
    if (selected.length !== data.questions.length) return setError("Hãy trả lời tất cả câu hỏi trước khi nộp bài.");
    setBusy(true); setError("");
    try {
      let latestDiagnosis: Diagnosis | null = null;
      for (const [questionId, optionId] of selected) {
        const response = await fetch("/api/attempts", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ eventId: crypto.randomUUID(), studentId: student.id, assignmentId: data.assignment.id, questionId, optionId, occurredAt: new Date().toISOString() }),
        });
        const result = await response.json() as Diagnosis & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Không lưu được câu trả lời");
        latestDiagnosis = result;
      }
      setDiagnosis(latestDiagnosis); setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  function openPractice(practice: StudentPractice) {
    setActivePractice(practice); setPracticeAnswers({}); setPracticeResult(null); setError("");
  }

  async function submitPractice() {
    if (!activePractice || Object.keys(practiceAnswers).length !== activePractice.questions.length) return setError("Hãy trả lời đủ tất cả câu hỏi.");
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/student/practice/submit", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ practiceId: activePractice.id, answers: practiceAnswers }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Chưa nộp được bài luyện tập.");
      setPracticeResult(result);
      await loadPractices();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa nộp được bài luyện tập.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell page">
      <div className="page-heading">
        <div><div className="eyebrow">Góc học tập</div><h1>{student ? `Chào ${student.displayName}!` : "Chào em!"}</h1><p>{data ? `${data.classroom.name} · Mã lớp ${data.classroom.code}` : "Đang tải lớp học..."}</p></div>
        {student && <button className="button secondary" onClick={logoutStudent}>Đăng xuất SBD {student.studentNumber}</button>}
      </div>

      {error && <div className="notice error">{error}</div>}
      {!data && !error && <div className="card empty">Đang chuẩn bị bài học...</div>}

      {data && !student && (
        <section className="student-entry">
          <div className="entry-copy"><span className="pill blue">Tài khoản học sinh</span><h2>Nhập số báo danh để vào học.</h2><p>SBD là thông tin bắt buộc. Họ tên có thể để trống; tài khoản mới khi đó sẽ dùng tên mặc định theo SBD.</p><div className="entry-note"><strong>{data.assignment.title}</strong><span>Bài diagnostic và các bộ luyện tập giáo viên đã duyệt</span></div></div>
          <form className="identity-form" onSubmit={login}>
            <label><span>Số báo danh <b aria-hidden="true">*</b></span><input autoFocus required inputMode="numeric" pattern="[0-9]*" maxLength={40} placeholder="Nhập SBD của em" value={studentNumber} onChange={(event) => setStudentNumber(event.target.value.replace(/\D/g, ""))} /></label>
            <label><span>Họ và tên <small>(không bắt buộc)</small></span><input maxLength={80} autoComplete="name" placeholder="Có thể để trống" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
            <button className="button primary" disabled={busy || !studentNumber.trim()}>{busy ? "Đang mở tài khoản..." : "Vào tài khoản"}</button>
            <small>Tài khoản demo: Minh 9001 · An 9002 · Lan 9003. Nếu SBD đã tồn tại, hệ thống luôn dùng tên và dữ liệu đã lưu của SBD đó.</small>
          </form>
        </section>
      )}

      {data && student && activePractice && (
        <section className="card stack student-test personalized-runner">
          <header className="test-header"><div className="test-title"><span className="pill blue">Bài luyện tập cá nhân</span><h2>{activePractice.title}</h2><p>{activePractice.objective}</p></div><button className="button secondary" onClick={() => { setActivePractice(null); setPracticeResult(null); }}>← Về danh sách bài</button></header>
          {practiceResult ? (
            <div className="practice-result">
              <div className="results-hero"><div className="success-mark">✓</div><div><span className="pill">Đã nộp bài</span><h2>Em đúng {practiceResult.score}/{practiceResult.total} câu</h2><p>Kết quả đã được lưu để giáo viên theo dõi. Xem lời giải từng câu bên dưới.</p></div></div>
              <div className="answer-results">
                {activePractice.questions.map((question, index) => {
                  const result = practiceResult.results.find((item) => item.questionId === question.id);
                  return result ? <article className={`answer-result ${result.isCorrect ? "correct" : "incorrect"}`} key={question.id}><div className="answer-result-status">{result.isCorrect ? "✓" : "!"}</div><div className="answer-result-body"><div className="answer-result-heading"><strong>Câu {index + 1}. {question.stem}</strong><span>{result.isCorrect ? "Đúng" : "Chưa đúng"}</span></div><p><b>Em chọn:</b> {result.selectedOptionId} · <b>Đáp án:</b> {result.correctOptionId}</p><p className="correct-answer">{result.explanation}</p></div></article> : null;
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="practice-instructions">{activePractice.instructions}</div>
              <div className="test-progress"><span>Tiến độ</span><strong>{Object.keys(practiceAnswers).length}/{activePractice.questions.length} câu đã chọn</strong><div><i style={{ width: `${Object.keys(practiceAnswers).length / activePractice.questions.length * 100}%` }} /></div></div>
              {activePractice.questions.map((question, index) => <div className="question" key={question.id}><span className="practice-difficulty">{question.difficulty}</span><strong>Câu {index + 1}. {question.stem}</strong><div className="options">{question.options.map((option) => <label className="option" key={option.id}><input type="radio" name={`practice-${question.id}`} checked={practiceAnswers[question.id] === option.id} onChange={() => setPracticeAnswers((current) => ({ ...current, [question.id]: option.id }))} /><span><strong>{option.id}.</strong> {option.content}</span></label>)}</div></div>)}
              <button className="button primary" disabled={busy || Object.keys(practiceAnswers).length !== activePractice.questions.length} onClick={submitPractice}>{busy ? "Đang nộp..." : "Nộp bài luyện tập"}</button>
            </>
          )}
        </section>
      )}

      {data && student && !activePractice && (
        <>
          <section className="student-practice-inbox">
            <div className="inbox-heading"><div><span className="pill blue">Bài giáo viên giao</span><h2>Luyện tập dành riêng cho em</h2><p>Mỗi bộ bài đã được giáo viên xem trước khi gửi.</p></div><strong>{practices.filter((item) => item.status !== "submitted").length} bài cần làm</strong></div>
            {!practices.length ? <div className="ai-empty">Chưa có bài luyện tập cá nhân nào được giao.</div> : <div className="practice-card-grid">{practices.map((practice) => <article key={practice.id}><span>{practice.skillName}</span><h3>{practice.title}</h3><p>{practice.objective}</p><div><small>{practice.questions.length} câu</small>{practice.status === "submitted" ? <strong>Đã nộp · {practice.score}/{practice.total}</strong> : <strong>Đang chờ em</strong>}</div><button className="button secondary" disabled={practice.status === "submitted"} onClick={() => openPractice(practice)}>{practice.status === "submitted" ? "✓ Đã hoàn thành" : "Làm bài ngay"}</button></article>)}</div>}
          </section>

          {submitted && diagnosis ? (
            <section className="student-results" aria-live="polite">
              <header className="results-hero"><div className="success-mark">✓</div><div><span className="pill">Đã nộp và khóa kết quả</span><h2>Kết quả bài diagnostic</h2><p>Em làm đúng {diagnosis.evidence.filter((item) => item.isCorrect).length}/{diagnosis.evidence.length} câu. Những câu sai có phần giải thích từ Mina.</p></div><div className="result-score"><strong>{diagnosis.evidence.length ? Math.round(diagnosis.evidence.filter((item) => item.isCorrect).length / diagnosis.evidence.length * 100) : 0}%</strong><span>Chính xác</span></div></header>
              <div className="answer-results">{data.questions.map((question, index) => { const evidence = diagnosis.evidence.find((item) => item.questionId === question.id); if (!evidence) return null; const correctContent = question.options.find((option) => option.id === evidence.correctOptionId)?.content; const explanation = explanations[question.id]; return <article className={`answer-result ${evidence.isCorrect ? "correct" : "incorrect"}`} key={question.id}><div className="answer-result-status">{evidence.isCorrect ? "✓" : "!"}</div><div className="answer-result-body"><div className="answer-result-heading"><strong>Câu {index + 1}. {question.stem}</strong><span>{evidence.isCorrect ? "Đúng" : "Chưa đúng"}</span></div><p><b>Em đã chọn:</b> {evidence.selectedOptionId}. {evidence.selectedContent}</p>{!evidence.isCorrect && <p className="correct-answer"><b>Đáp án phù hợp:</b> {evidence.correctOptionId}. {correctContent}</p>}{!evidence.isCorrect && <button className="button secondary" disabled={explanationBusy === question.id} onClick={() => requestExplanation(question.id)}>{explanationBusy === question.id ? "Mina đang giải thích..." : explanation ? "Xem lại giải thích của Mina" : "✨ Nhờ Mina giải thích"}</button>}{explanation && <aside className="answer-explanation"><div><strong>Mina giải thích</strong><span>{explanation.ai.mode === "llm" ? "AI trực tuyến" : "Bản dự phòng có căn cứ"}</span></div><p>{explanation.feedback}</p><ol>{explanation.steps.map((step) => <li key={step}>{step}</li>)}</ol><section><span>Em tự kiểm tra:</span><strong>{explanation.selfCheckQuestion}</strong></section></aside>}</div></article>; })}</div>
            </section>
          ) : (
            <section className="card stack student-test">
              <header className="test-header"><div className="test-title"><span className="pill blue">Bài diagnostic</span><h2>{data.assignment.title}</h2><p>Hoàn thành tất cả câu hỏi rồi nộp bài cho giáo viên.</p></div><div className="test-candidate"><div><span>Thí sinh</span><strong>{student.displayName}</strong></div><div><span>Số báo danh</span><strong>{student.studentNumber}</strong></div></div></header>
              <div className="test-progress"><span>Tiến độ</span><strong>{Object.keys(answers).length}/{data.questions.length} câu đã chọn</strong><div><i style={{ width: `${data.questions.length ? Object.keys(answers).length / data.questions.length * 100 : 0}%` }} /></div></div>
              {data.questions.map((question, index) => <div className="question" key={question.id}><strong>Câu {index + 1}. {question.stem}</strong><div className="options">{question.options.map((option) => <label className="option" key={option.id}><input type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))} /><span><strong>{option.id}.</strong> {option.content}</span></label>)}</div></div>)}
              <button className="button primary" onClick={submitInteractive} disabled={busy || Object.keys(answers).length !== data.questions.length}>{busy ? "Đang nộp bài..." : "Nộp bài cho giáo viên"}</button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
