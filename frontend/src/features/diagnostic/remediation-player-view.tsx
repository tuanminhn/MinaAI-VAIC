import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { SubmitRemediationAttemptResponse } from "@/contracts/diagnostic";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button.variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { DiagnosticFeedbackPanel } from "@/features/diagnostic/components/diagnostic-feedback-panel";
import { DiagnosticProgress } from "@/features/diagnostic/components/diagnostic-progress";
import { DiagnosticQuestionForm } from "@/features/diagnostic/components/diagnostic-question-form";
import { DiagnosticSessionSkeleton } from "@/features/diagnostic/components/diagnostic-session-skeleton";
import {
  getLearningLoadMessage,
  getLearningSubmitMessage,
  isLearningSessionExpired,
  isLearningSessionMissing,
} from "@/features/diagnostic/helpers/learning-flow-error-messages";
import { useRemediationQuery } from "@/features/diagnostic/hooks/use-remediation-query";
import { useSubmitRemediationAttemptMutation } from "@/features/diagnostic/hooks/use-submit-remediation-attempt-mutation";
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

export function RemediationPlayerView(): JSX.Element {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const remediationQuery = useRemediationQuery(sessionId);
  const submitMutation = useSubmitRemediationAttemptMutation();
  const submitAbortControllerRef = useRef<AbortController | null>(null);
  const currentClientAttemptIdRef = useRef<string | null>(null);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackResponse, setFeedbackResponse] =
    useState<SubmitRemediationAttemptResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const remediationData = remediationQuery.data;
  const currentQuestionId = remediationData?.currentQuestion?.id ?? null;

  useEffect(() => {
    return () => {
      submitAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setSelectedOptionId(null);
    setFeedbackResponse(null);
    setSubmitError(null);
    currentClientAttemptIdRef.current = null;
  }, [currentQuestionId]);

  useEffect(() => {
    const apiError = getApiError(remediationQuery.error);

    if (!apiError || !isLearningSessionExpired(apiError)) {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, navigate, remediationQuery.error]);

  async function handleSubmit(): Promise<void> {
    if (!remediationData?.currentQuestion || !selectedOptionId || submitMutation.isPending) {
      return;
    }

    submitAbortControllerRef.current?.abort();
    submitAbortControllerRef.current = new AbortController();
    setSubmitError(null);

    try {
      if (!currentClientAttemptIdRef.current) {
        currentClientAttemptIdRef.current = crypto.randomUUID();
      }

      const response = await submitMutation.mutateAsync({
        sessionId,
        input: {
          questionId: remediationData.currentQuestion.id,
          selectedOptionId,
          clientAttemptId: currentClientAttemptIdRef.current,
        },
        signal: submitAbortControllerRef.current.signal,
      });

      setFeedbackResponse(response);
    } catch (error) {
      const apiError = getApiError(error);

      if (apiError && isLearningSessionExpired(apiError)) {
        auth.resetSession(getSessionRestoreNotice(apiError));
        navigate("/login", { replace: true });
        return;
      }

      const message = apiError
        ? getLearningSubmitMessage("remediation", apiError)
        : {
            title: "Chưa gửi được câu trả lời",
            description:
              "Chưa thể kết nối đến máy chủ Mina trong trường. Bài luyện tập của em chưa được gửi. Hãy thử lại.",
          };

      setSubmitError(message.description);
    }
  }

  async function handleNextQuestion(): Promise<void> {
    setFeedbackResponse(null);
    setSubmitError(null);
    setSelectedOptionId(null);

    await queryClient.invalidateQueries({
      queryKey: queryKeys.diagnostic.remediation(sessionId),
    });
  }

  if (remediationQuery.isPending) {
    return <DiagnosticSessionSkeleton />;
  }

  if (remediationQuery.isError) {
    const apiError = getApiError(remediationQuery.error);
    const message = apiError
      ? getLearningLoadMessage(apiError, "remediation")
      : {
          title: "Chưa thể tải phần củng cố",
          description:
            "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để mở lại bài củng cố.",
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
            queryKey: queryKeys.diagnostic.remediation(sessionId),
          });
        }}
      />
    );
  }

  if (!remediationData) {
    return <></>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/student/assignments"
            className={cn(buttonVariants({ variant: "secondary" }), "no-underline")}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Quay về Bài được giao
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Củng cố kiến thức
          </p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
            {remediationData.assignmentTitle}
          </h1>
        </div>

        <DiagnosticProgress progress={remediationData.progress} ariaLabel="Tiến độ bài củng cố" />
      </header>

      <Card variant="student-focus">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">{remediationData.unit.title}</CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">{remediationData.unit.summary}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Cách làm</h2>
            <p className="text-sm leading-6 text-[var(--text-primary)]">
              {remediationData.unit.explanation}
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Ví dụ</h2>
            <p className="text-sm leading-6 text-[var(--text-primary)]">
              {remediationData.unit.workedExample}
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Em hãy thử</h2>
            <p className="text-sm leading-6 text-[var(--text-primary)]">
              {remediationData.unit.practiceInstruction}
            </p>
          </section>
        </CardContent>
      </Card>

      {remediationData.currentQuestion ? (
        <DiagnosticQuestionForm
          question={remediationData.currentQuestion}
          selectedOptionId={selectedOptionId}
          disabled={submitMutation.isPending || feedbackResponse !== null}
          submitError={submitError}
          isSubmitting={submitMutation.isPending}
          onOptionChange={(optionId) => {
            setSelectedOptionId(optionId);
            setSubmitError(null);
          }}
          onSubmit={() => {
            void handleSubmit();
          }}
        />
      ) : null}

      {feedbackResponse ? (
        <DiagnosticFeedbackPanel
          response={feedbackResponse}
          onContinue={() => {
            void handleNextQuestion();
          }}
        />
      ) : null}
    </div>
  );
}
