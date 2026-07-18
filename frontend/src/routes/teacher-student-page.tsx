import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query/query-keys";
import { httpTeacherRepository } from "@/repositories/http-teacher-repository";

const statusLabel: Record<string, string> = { mastered: "Đã vững", needs_review: "Cần ôn lại", needs_teacher_support: "Cần hỗ trợ", diagnosing: "Đang chẩn đoán", learning: "Đang học", practicing: "Đang luyện" };

export default function TeacherStudentPage(): JSX.Element {
  const { studentId = "" } = useParams();
  const query = useQuery({ queryKey: queryKeys.teacher.studentProfile(studentId), queryFn: ({ signal }) => httpTeacherRepository.getStudentProfile(studentId, signal), enabled: Boolean(studentId) });
  if (query.isLoading) return <p>Đang tải hồ sơ học sinh…</p>;
  if (query.isError || !query.data) return <p role="alert">Không thể tải hồ sơ học sinh.</p>;
  const profile = query.data;
  return <div className="space-y-6">
    <div><p className="text-sm font-semibold text-[var(--text-secondary)]">{profile.schoolName} · {profile.classroomName}</p><h1 className="text-3xl font-bold">{profile.displayName}</h1><p className="mt-2 text-[var(--text-secondary)]">Hồ sơ năng lực được tích lũy từ các lần chẩn đoán, củng cố và transfer.</p></div>
    <Card><CardHeader><CardTitle>Năng lực theo kỹ năng</CardTitle></CardHeader><CardContent>{profile.masteries.length === 0 ? <p>Chưa đủ bằng chứng để tạo hồ sơ năng lực.</p> : <div className="space-y-4">{profile.masteries.map((item) => <div key={item.skillId} className="border-b pb-3 last:border-0"><div className="flex justify-between gap-3"><p className="font-semibold">{item.skillName}</p><Badge>{statusLabel[item.status] ?? item.status}</Badge></div><p className="mt-1 text-sm text-[var(--text-secondary)]">Mức thành thạo {Math.round(item.masteryScore * 100)}% · Độ tin cậy {Math.round(item.confidence * 100)}% · {item.evidenceCount} bằng chứng</p></div>)}</div>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Lịch sử học gần đây</CardTitle></CardHeader><CardContent className="space-y-4">{profile.recentSessions.map((session) => <div key={session.sessionId} className="border-b pb-3 last:border-0"><Link className="font-semibold" to={`/teacher/sessions/${session.sessionId}`}>{session.assignmentTitle}</Link><p className="text-sm text-[var(--text-secondary)]">{session.rootCauseSkillName ? `Lỗ hổng: ${session.rootCauseSkillName}` : "Chưa phát hiện lỗ hổng"} · {session.state}</p></div>)}</CardContent></Card>
  </div>;
}
