import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { queryKeys } from "@/lib/query/query-keys";
import { httpTeacherRepository } from "@/repositories/http-teacher-repository";

export default function TeacherInterventionsPage(): JSX.Element {
  const query = useQuery({ queryKey: queryKeys.teacher.interventions(), queryFn: ({ signal }) => httpTeacherRepository.listInterventions(signal) });
  return <div className="space-y-6">
    <div><p className="text-sm font-semibold text-[var(--text-secondary)]">Xếp theo mức cần hỗ trợ</p><h1 className="text-3xl font-bold">Ai cần giúp trước?</h1><p className="mt-2 text-[var(--text-secondary)]">Ưu tiên dựa trên kết quả transfer và trạng thái mắc kẹt trong lộ trình.</p></div>
    {query.isLoading ? <p>Đang tính mức ưu tiên…</p> : null}
    {query.isError ? <p role="alert">Không thể tải danh sách can thiệp.</p> : null}
    {query.data?.items.length === 0 ? <EmptyState title="Chưa có học sinh cần can thiệp" description="Các em hiện đang tiến triển bình thường." /> : null}
    <div className="space-y-4">{query.data?.items.map((item) => <Card key={item.sessionId}>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5" />{item.studentName}</CardTitle><Badge>{item.priority === "high" ? "Ưu tiên cao" : "Ưu tiên vừa"} · {item.priorityScore}</Badge></div></CardHeader>
      <CardContent className="space-y-2"><p className="font-medium">{item.classroomName} · {item.assignmentTitle}</p><p>{item.reason}</p><div className="flex gap-4 text-sm"><Link to={`/teacher/students/${item.studentId}`}>Xem hồ sơ</Link><Link to={`/teacher/sessions/${item.sessionId}`}>Xem bằng chứng</Link></div></CardContent>
    </Card>)}</div>
  </div>;
}
