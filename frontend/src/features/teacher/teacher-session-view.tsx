import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { getTeacherApiError } from "@/features/teacher/helpers/teacher-api-error";
import {
  formatTeacherDateTime,
  getTeacherOutcomeLabel,
  getTeacherReasonLabel,
  getTeacherSessionStateLabel,
} from "@/features/teacher/helpers/teacher-presentation";
import { useTeacherLearningSessionQuery } from "@/features/teacher/hooks/use-teacher-learning-session-query";

export function TeacherSessionView(): JSX.Element {
  const { sessionId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const evidenceQuery = useTeacherLearningSessionQuery(sessionId);

  useEffect(() => {
    const apiError = getTeacherApiError(evidenceQuery.error);
    if (!apiError || apiError.code !== "SESSION_EXPIRED") {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, evidenceQuery.error, navigate]);

  if (evidenceQuery.isPending) {
    return <p className="text-sm text-[var(--text-secondary)]">Đang tải learning evidence...</p>;
  }

  if (evidenceQuery.isError) {
    const apiError = getTeacherApiError(evidenceQuery.error);

    if (apiError?.code === "DIAGNOSTIC_SESSION_NOT_FOUND") {
      return (
        <EmptyState
          title="Không tìm thấy phiên học"
          description="Phiên học này không thuộc phạm vi giáo viên đang phụ trách hoặc đã không còn khả dụng."
          action={{
            label: "Quay về tổng quan",
            onClick: () => navigate("/teacher"),
          }}
        />
      );
    }

    return (
      <AppErrorFallback
        title={apiError?.message ?? "Chưa thể tải learning evidence"}
        description="Mina chưa lấy được timeline và attempt evidence từ máy chủ trong trường. Hãy thử lại."
        onRetry={() => {
          void evidenceQuery.refetch();
        }}
      />
    );
  }

  if (!evidenceQuery.data) {
    return <></>;
  }

  const evidence = evidenceQuery.data;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Learning evidence
        </p>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
          {evidence.student.displayName}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">{evidence.assignment.title}</p>
      </header>

      <Card variant="teacher-compact">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={evidence.outcome === "needsTeacherSupport" ? "warning" : "success"}>
              {getTeacherOutcomeLabel(evidence.outcome)}
            </Badge>
            <Badge variant="info">{getTeacherSessionStateLabel(evidence.state)}</Badge>
          </div>
          <CardTitle className="text-xl">Tóm tắt phiên học</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-primary)]">
          <p>
            Root cause: {evidence.rootCause?.name ?? "Chưa xác định"}
          </p>
          <p>Tổng số attempt: {evidence.attempts.length}</p>
          <p>Tổng số mốc timeline: {evidence.timeline.length}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card variant="teacher-compact">
          <CardHeader>
            <CardTitle className="text-xl">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {evidence.timeline.length === 0 ? (
              <EmptyState
                title="Chưa có timeline"
                description="Các mốc chuyển trạng thái sẽ xuất hiện tại đây sau khi học sinh bắt đầu phiên học."
              />
            ) : (
              <ol className="space-y-3">
                {evidence.timeline.map((item, index) => (
                  <li
                    key={`${item.createdAt}-${index}`}
                    className="rounded-[var(--radius-base)] border border-[var(--border)] px-3 py-3"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {getTeacherReasonLabel(item.reasonCode)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {formatTeacherDateTime(item.createdAt)}
                    </p>
                    {item.skillName ? (
                      <p className="mt-1 text-sm text-[var(--text-primary)]">{item.skillName}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card variant="teacher-compact">
          <CardHeader>
            <CardTitle className="text-xl">Attempt evidence</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <th className="px-3 py-3 font-medium">Phase</th>
                  <th className="px-3 py-3 font-medium">Kỹ năng</th>
                  <th className="px-3 py-3 font-medium">Câu hỏi</th>
                  <th className="px-3 py-3 font-medium">Lựa chọn</th>
                  <th className="px-3 py-3 font-medium">Kết quả</th>
                  <th className="px-3 py-3 font-medium">Thời điểm</th>
                </tr>
              </thead>
              <tbody>
                {evidence.attempts.map((attempt, index) => (
                  <tr
                    key={`${attempt.phase}-${attempt.answeredAt}-${index}`}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <td className="px-3 py-3 text-[var(--text-primary)]">{attempt.phase}</td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">{attempt.skillName}</td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">{attempt.questionPrompt}</td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">{attempt.selectedOptionLabel}</td>
                    <td className="px-3 py-3">
                      <Badge variant={attempt.isCorrect ? "success" : "warning"}>
                        {attempt.isCorrect ? "Đúng" : "Chưa đúng"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {formatTeacherDateTime(attempt.answeredAt)}
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
