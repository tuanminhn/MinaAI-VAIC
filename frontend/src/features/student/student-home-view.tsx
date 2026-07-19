import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpenText, ListChecks } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button.variants";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { AssignmentCard } from "@/features/student/components/assignment-card";
import { StudentHomeSkeleton } from "@/features/student/components/student-home-skeleton";
import { useStudentHomeQuery } from "@/features/student/hooks/use-student-home-query";
import { isApiError } from "@/lib/api/api-error";
import { HttpRequestError } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils/cn";

function getApiError(error: unknown) {
  if (error instanceof HttpRequestError) {
    return error.apiError;
  }

  return isApiError(error) ? error : null;
}

export function StudentHomeView(): JSX.Element {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const navigate = useNavigate();
  const homeQuery = useStudentHomeQuery();

  useEffect(() => {
    const apiError = getApiError(homeQuery.error);
    if (!apiError || (apiError.code !== "AUTH_REQUIRED" && apiError.code !== "SESSION_EXPIRED")) {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, homeQuery.error, navigate]);

  if (homeQuery.isPending) {
    return <StudentHomeSkeleton />;
  }

  if (homeQuery.isError) {
    return (
      <AppErrorFallback
        title="Chưa thể tải bài được giao"
        description="Chưa thể tải bài được giao từ máy chủ Mina trong trường. Hãy kiểm tra kết nối Wi-Fi nội bộ hoặc thử lại."
        onRetry={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.student.home() });
        }}
      />
    );
  }

  const { student, currentAssignment, recentAssignments } = homeQuery.data;

  return (
    <div className="space-y-8">
      <section aria-labelledby="student-home-heading" className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Hôm nay em cần làm gì?
        </p>
        <h1 id="student-home-heading" className="text-3xl font-semibold text-[var(--text-primary)]">
          Chào em, {student.displayName}.
        </h1>
        {student.classroomName ? (
          <p className="text-base text-[var(--text-secondary)]">{student.classroomName}</p>
        ) : null}
        {student.schoolName ? (
          <p className="text-base text-[var(--text-secondary)]">{student.schoolName}</p>
        ) : null}
      </section>

      <section aria-labelledby="current-assignment-heading" className="space-y-4">
        <div>
          <h2 id="current-assignment-heading" className="text-2xl font-semibold text-[var(--text-primary)]">
            Bài hiện tại
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Chỉ cần làm từng bước một. Mina AI sẽ giữ cho tiến độ của em rõ ràng.
          </p>
        </div>

        {currentAssignment ? (
          <AssignmentCard assignment={currentAssignment} emphasized />
        ) : (
          <EmptyState
            title="Hiện em chưa có bài mới."
            description="Khi giáo viên giao bài, bài học sẽ xuất hiện tại đây."
            icon={BookOpenText}
          />
        )}
      </section>

      <section aria-labelledby="recent-assignments-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="recent-assignments-heading"
              className="text-2xl font-semibold text-[var(--text-primary)]"
            >
              Bài gần đây
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Em có thể xem nhanh các bài vừa được giao và tiếp tục đúng chỗ.
            </p>
          </div>
          <Link
            to="/student/assignments"
            className={cn(buttonVariants({ variant: "secondary" }), "no-underline")}
          >
            Xem tất cả bài được giao
          </Link>
        </div>

        {recentAssignments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentAssignments.slice(0, 2).map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} headingLevel="h3" />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có bài gần đây"
            description="Khi có bài mới hoặc bài đang dở, danh sách này sẽ xuất hiện để em tiếp tục."
            icon={ListChecks}
          />
        )}
      </section>
    </div>
  );
}
