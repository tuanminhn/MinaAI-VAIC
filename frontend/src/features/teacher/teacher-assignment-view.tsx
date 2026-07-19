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
import {
  formatTeacherDateTime,
  getTeacherAssignmentStatusLabel,
  getTeacherOutcomeLabel,
  getTeacherSessionStateLabel,
} from "@/features/teacher/helpers/teacher-presentation";
import { useTeacherAssignmentPageQuery } from "@/features/teacher/hooks/use-teacher-assignment-page-query";
import { cn } from "@/lib/utils/cn";

function CountCard({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function TeacherAssignmentView(): JSX.Element {
  const { assignmentId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const { overviewQuery, studentsQuery } = useTeacherAssignmentPageQuery(assignmentId);

  const firstError = overviewQuery.error ?? studentsQuery.error;

  useEffect(() => {
    const apiError = getTeacherApiError(firstError);
    if (!apiError || apiError.code !== "SESSION_EXPIRED") {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, firstError, navigate]);

  if (overviewQuery.isPending || studentsQuery.isPending) {
    return <p className="text-sm text-[var(--text-secondary)]">Đang tải tiến độ bài được giao...</p>;
  }

  if (overviewQuery.isError || studentsQuery.isError) {
    const apiError = getTeacherApiError(firstError);

    if (apiError?.code === "ASSIGNMENT_NOT_FOUND") {
      return (
        <EmptyState
          title="Không tìm thấy bài được giao"
          description="Bài này không thuộc lớp giáo viên đang phụ trách hoặc đã không còn khả dụng."
          action={{
            label: "Quay về tổng quan",
            onClick: () => navigate("/teacher"),
          }}
        />
      );
    }

    return (
      <AppErrorFallback
        title={apiError?.message ?? "Chưa thể tải tiến độ bài được giao"}
        description="Mina chưa lấy được dữ liệu tiến độ lớp từ máy chủ trong trường. Hãy thử lại."
        onRetry={() => {
          void overviewQuery.refetch();
          void studentsQuery.refetch();
        }}
      />
    );
  }

  if (!overviewQuery.data || !studentsQuery.data) {
    return <></>;
  }

  const overview = overviewQuery.data;
  const students = studentsQuery.data;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Theo dõi assignment
        </p>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
          {overview.assignment.title}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {overview.assignment.classroomName}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CountCard label="Chưa bắt đầu" value={overview.counts.notStarted} />
        <CountCard label="Đang chẩn đoán" value={overview.counts.diagnosing} />
        <CountCard label="Đang củng cố" value={overview.counts.inRemediation} />
        <CountCard label="Đã hoàn thành" value={overview.counts.completed} />
        <CountCard label="Cần hỗ trợ" value={overview.counts.needsSupport} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card variant="teacher-compact">
          <CardHeader>
            <CardTitle className="text-xl">Nhóm root cause</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.rootCauseGroups.length === 0 ? (
              <EmptyState
                title="Chưa có root cause"
                description="Khi học sinh đi qua chẩn đoán, các nhóm kiến thức cần củng cố sẽ xuất hiện tại đây."
              />
            ) : (
              <ul className="space-y-3">
                {overview.rootCauseGroups.map((group) => (
                  <li
                    key={group.skillName}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-base)] border border-[var(--border)] px-3 py-3"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {group.skillName}
                    </span>
                    <Badge variant="warning">{group.studentCount} học sinh</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card variant="teacher-compact">
          <CardHeader>
            <CardTitle className="text-xl">Theo dõi học sinh</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <th className="px-3 py-3 font-medium">Học sinh</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                  <th className="px-3 py-3 font-medium">Phiên học</th>
                  <th className="px-3 py-3 font-medium">Kết quả</th>
                  <th className="px-3 py-3 font-medium">Root cause</th>
                  <th className="px-3 py-3 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {students.items.map((item) => (
                  <tr key={item.student.id} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-3 py-3 text-[var(--text-primary)]">{item.student.displayName}</td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {getTeacherAssignmentStatusLabel(item.assignmentStatus)}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {getTeacherSessionStateLabel(item.sessionState)}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {getTeacherOutcomeLabel(item.outcome)}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {item.rootCauseSkillName ?? "Chưa có"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <p className="text-[var(--text-primary)]">
                          D:{item.diagnosticAttempts} · C:{item.remediationAttempts} · T:{item.transferAttempts}
                        </p>
                        {item.sessionId ? (
                          <Link
                            to={`/teacher/sessions/${item.sessionId}`}
                            className={cn(
                              buttonVariants({ variant: "secondary", size: "sm" }),
                              "no-underline",
                            )}
                          >
                            Xem evidence
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">
                            Chưa có phiên học
                          </span>
                        )}
                        <p className="text-xs text-[var(--text-secondary)]">
                          Cập nhật {formatTeacherDateTime(item.updatedAt)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
