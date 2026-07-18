import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { queryKeys } from "@/lib/query/query-keys";
import { httpTeacherRepository } from "@/repositories/http-teacher-repository";

export default function TeacherGroupsPage(): JSX.Element {
  const query = useQuery({
    queryKey: queryKeys.teacher.supportGroups(),
    queryFn: ({ signal }) => httpTeacherRepository.listSupportGroups(signal),
  });

  return <div className="space-y-6">
    <div><p className="text-sm font-semibold text-[var(--text-secondary)]">Tự động theo nhu cầu</p><h1 className="text-3xl font-bold">Nhóm hỗ trợ</h1><p className="mt-2 text-[var(--text-secondary)]">Học sinh được gom theo lỗ hổng gốc từ phiên học gần nhất.</p></div>
    {query.isLoading ? <p>Đang phân tích nhóm học sinh…</p> : null}
    {query.isError ? <p role="alert">Không thể tải nhóm hỗ trợ. Hãy kiểm tra máy chủ nội bộ.</p> : null}
    {query.data?.items.length === 0 ? <EmptyState title="Chưa có nhóm hỗ trợ" description="Nhóm sẽ xuất hiện khi có học sinh được xác định lỗ hổng kiến thức." /> : null}
    <div className="grid gap-4 md:grid-cols-2">
      {query.data?.items.map((group) => <Card key={group.skillId}>
        <CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="flex items-center gap-2"><Users className="size-5" />{group.skillName}</CardTitle><Badge>{group.studentCount} học sinh</Badge></div></CardHeader>
        <CardContent className="space-y-3"><p>Lớp: {group.classroomNames.join(", ")}</p><p className="text-sm text-[var(--text-secondary)]">{group.needsSupportCount > 0 ? `${group.needsSupportCount} em cần giáo viên hỗ trợ trực tiếp.` : "Nhóm có thể tiếp tục lộ trình củng cố tự học."}</p></CardContent>
      </Card>)}
    </div>
  </div>;
}
