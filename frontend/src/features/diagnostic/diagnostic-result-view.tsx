import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, LifeBuoy } from "lucide-react";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button.variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import {
  getLearningLoadMessage,
  isLearningSessionExpired,
  isLearningSessionMissing,
} from "@/features/diagnostic/helpers/learning-flow-error-messages";
import { getOutcomeLabel } from "@/features/diagnostic/helpers/result-presentation";
import { useResultQuery } from "@/features/diagnostic/hooks/use-result-query";
import { isApiError } from "@/lib/api/api-error";
import { HttpRequestError } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/query/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

function getApiError(error: unknown) {
  if (error instanceof HttpRequestError) {
    return error.apiError;
  }

  return isApiError(error) ? error : null;
}

export function DiagnosticResultView(): JSX.Element {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const resultQuery = useResultQuery(sessionId);

  useEffect(() => {
    const apiError = getApiError(resultQuery.error);

    if (!apiError || !isLearningSessionExpired(apiError)) {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, navigate, resultQuery.error]);

  if (resultQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--text-secondary)]">Đang tải kết quả bài học...</p>
      </div>
    );
  }

  if (resultQuery.isError) {
    const apiError = getApiError(resultQuery.error);
    const message = apiError
      ? getLearningLoadMessage(apiError, "result")
      : {
          title: "Chưa thể tải kết quả",
          description:
            "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để xem kết quả bài học.",
        };

    if (apiError && isLearningSessionMissing(apiError)) {
      return (
        <EmptyState
          title={message.title}
          description={message.description}
          action={{
            label: "Quay về Bài được giao",
            onClick: () => navigate("/student/assignments"),
          }}
        />
      );
    }

    return (
      <AppErrorFallback
        title={message.title}
        description={message.description}
        onRetry={() => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.diagnostic.result(sessionId),
          });
        }}
      />
    );
  }

  if (!resultQuery.data) {
    return <></>;
  }

  const result = resultQuery.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card variant="student-focus">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            {result.outcome === "needs_teacher_support" ? (
              <LifeBuoy aria-hidden="true" className="size-6 text-[var(--warning)]" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-6 text-[var(--success)]" />
            )}
            <Badge variant={result.outcome === "needs_teacher_support" ? "warning" : "success"}>
              {getOutcomeLabel(result.outcome)}
            </Badge>
          </div>
          <CardTitle className="text-3xl">{result.summary.title}</CardTitle>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{result.summary.message}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Bài học đã hoàn thành
            </h2>
            <p className="text-sm text-[var(--text-primary)]">{result.assignment.title}</p>
          </section>

          {result.rootCause ? (
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Phần kiến thức đã được củng cố
              </h2>
              <p className="text-sm text-[var(--text-primary)]">{result.rootCause.name}</p>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Câu diagnostic</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {result.learningEvidence.diagnosticQuestionsAnswered}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Câu củng cố</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {result.learningEvidence.remediationQuestionsAnswered}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Câu kiểm tra lại</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {result.learningEvidence.transferQuestionsAnswered}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Số vòng củng cố</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {result.learningEvidence.remediationCycles}
              </p>
            </div>
          </section>

          <Link
            to="/student"
            className={cn(buttonVariants({ variant: "primary" }), "no-underline")}
          >
            Quay về trang học sinh
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
