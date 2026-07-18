import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button.variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { getTeacherApiError } from "@/features/teacher/helpers/teacher-api-error";
import { formatTeacherDateTime } from "@/features/teacher/helpers/teacher-presentation";
import { useTeacherClassPageQuery } from "@/features/teacher/hooks/use-teacher-class-page-query";
import { cn } from "@/lib/utils/cn";

export function TeacherClassView(): JSX.Element {
  const { classId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const { detailQuery, assignmentsQuery, studentsQuery } = useTeacherClassPageQuery(classId);

  const firstError = detailQuery.error ?? assignmentsQuery.error ?? studentsQuery.error;

  useEffect(() => {
    const apiError = getTeacherApiError(firstError);
    if (!apiError || apiError.code !== "SESSION_EXPIRED") {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, firstError, navigate]);

  if (detailQuery.isPending || assignmentsQuery.isPending || studentsQuery.isPending) {
    return <p className="text-sm text-[var(--text-secondary)]">Đang tải thông tin lớp học...</p>;
  }

  if (detailQuery.isError || assignmentsQuery.isError || studentsQuery.isError) {
    const apiError = getTeacherApiError(firstError);

    if (apiError?.code === "CLASSROOM_NOT_FOUND") {
      return (
        <EmptyState
          title="Không tìm thấy lớp học"
          description="Lớp học này không thuộc phạm vi giáo viên đang phụ trách hoặc đã không còn khả dụng."
          action={{
            label: "Quay về tổng quan",
            onClick: () => navigate("/teacher"),
          }}
        />
      );
    }

    return (
      <AppErrorFallback
        title={apiError?.message ?? "Chưa thể tải lớp học"}
        description="Mina chưa lấy được chi tiết lớp học từ máy chủ trong trường. Hãy thử lại."
        onRetry={() => {
          void detailQuery.refetch();
          void assignmentsQuery.refetch();
          void studentsQuery.refetch();
        }}
      />
    );
  }

  if (!detailQuery.data || !assignmentsQuery.data || !studentsQuery.data) {
    return <></>;
  }

  const detail = detailQuery.data;
  const assignments = assignmentsQuery.data.items;
  const students = studentsQuery.data.items;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Lớp học
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">{detail.name}</h1>
          <Badge variant="info">Khối {detail.grade}</Badge>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {detail.school.name} · {detail.academicYear}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card variant="teacher-compact">
          <CardHeader>
            <CardTitle className="text-xl">Bài được giao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments.length === 0 ? (
              <EmptyState
                title="Chưa có bài được giao"
                description="Khi lớp học có assignment, danh sách sẽ xuất hiện tại đây."
              />
            ) : (
              assignments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-card)] border border-[var(--border)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Giao lúc {formatTeacherDateTime(item.assignedAt)}
                      </p>
                    </div>
                    <Badge variant="neutral">{item.studentCount} học sinh</Badge>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/teacher/assignments/${item.id}`}
                      className={cn(buttonVariants({ variant: "secondary" }), "no-underline")}
                    >
                      Xem tiến độ lớp
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card variant="teacher-compact">
          <CardHeader>
            <CardTitle className="text-xl">Danh sách học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <EmptyState
                title="Chưa có học sinh"
                description="Danh sách học sinh sẽ xuất hiện khi lớp đã được gán thành viên."
              />
            ) : (
              <ul className="space-y-3">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-base)] border border-[var(--border)] px-3 py-3"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {student.displayName}
                    </span>
                    <Badge variant={student.isActive ? "success" : "neutral"}>
                      {student.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
