import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button.variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { getTeacherApiError } from "@/features/teacher/helpers/teacher-api-error";
import { useTeacherClassesQuery } from "@/features/teacher/hooks/use-teacher-classes-query";
import { cn } from "@/lib/utils/cn";

export function TeacherDashboardView(): JSX.Element {
  const auth = useAuth();
  const navigate = useNavigate();
  const classesQuery = useTeacherClassesQuery();

  useEffect(() => {
    const apiError = getTeacherApiError(classesQuery.error);
    if (!apiError || apiError.code !== "SESSION_EXPIRED") {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, classesQuery.error, navigate]);

  if (classesQuery.isPending) {
    return <p className="text-sm text-[var(--text-secondary)]">Đang tải danh sách lớp học...</p>;
  }

  if (classesQuery.isError) {
    const apiError = getTeacherApiError(classesQuery.error);
    return (
      <AppErrorFallback
        title={apiError?.message ?? "Chưa thể tải lớp học"}
        description="Mina chưa lấy được danh sách lớp học từ máy chủ trong trường. Hãy thử lại."
        onRetry={() => {
          void classesQuery.refetch();
        }}
      />
    );
  }

  if (classesQuery.data.items.length === 0) {
    return (
      <EmptyState
        title="Chưa có lớp học"
        description="Lớp giáo viên phụ trách sẽ xuất hiện tại đây khi dữ liệu được đồng bộ."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Tổng quan giáo viên
        </p>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Lớp giáo viên phụ trách</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {classesQuery.data.items.map((item) => (
          <Card key={item.id} variant="teacher-compact">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">{item.name}</CardTitle>
                <Badge variant="info">Khối {item.grade}</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{item.schoolName}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-2 text-sm text-[var(--text-primary)]">
                <div className="flex items-center justify-between gap-3">
                  <dt>Mã lớp</dt>
                  <dd>{item.code}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Năm học</dt>
                  <dd>{item.academicYear}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Số học sinh</dt>
                  <dd>{item.studentCount}</dd>
                </div>
              </dl>

              <Link
                to={`/teacher/classes/${item.id}`}
                className={cn(buttonVariants({ variant: "primary" }), "no-underline")}
              >
                Xem lớp học
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
