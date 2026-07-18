import { useQueryClient } from "@tanstack/react-query";
import { BookOpenText } from "lucide-react";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AssignmentCard } from "@/features/student/components/assignment-card";
import { StudentAssignmentsSkeleton } from "@/features/student/components/student-assignments-skeleton";
import { useStudentAssignmentsQuery } from "@/features/student/hooks/use-student-assignments-query";
import { queryKeys } from "@/lib/query/query-keys";

export function StudentAssignmentsView(): JSX.Element {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const assignmentsQuery = useStudentAssignmentsQuery({ page: 1, pageSize: 10 });

  if (assignmentsQuery.isPending) {
    return <StudentAssignmentsSkeleton />;
  }

  if (assignmentsQuery.isError) {
    return (
      <AppErrorFallback
        title="Chưa thể tải danh sách bài được giao"
        description="Chưa thể tải bài được giao từ máy chủ Mina trong trường. Hãy kiểm tra kết nối Wi-Fi nội bộ hoặc thử lại."
        onRetry={() => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.student.assignments(session?.accessToken ?? null, undefined, 1, 10),
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="student-assignments-heading" className="space-y-2">
        <h1
          id="student-assignments-heading"
          className="text-3xl font-semibold text-[var(--text-primary)]"
        >
          Bài được giao
        </h1>
        <p className="text-base text-[var(--text-secondary)]">
          Xem các bài đang chờ, bài đang làm và bài em có thể mở lại để tiếp tục.
        </p>
      </section>

      {assignmentsQuery.data.items.length > 0 ? (
        <div className="space-y-4">
          {assignmentsQuery.data.items.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Hiện em chưa có bài mới."
          description="Khi giáo viên giao bài, bài học sẽ xuất hiện tại đây."
          icon={BookOpenText}
        />
      )}
    </div>
  );
}
