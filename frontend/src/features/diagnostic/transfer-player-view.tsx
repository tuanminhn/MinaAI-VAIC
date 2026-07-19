import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { SubmitTransferAttemptResponse } from "@/contracts/diagnostic";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button.variants";
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
import { useSubmitTransferAttemptMutation } from "@/features/diagnostic/hooks/use-submit-transfer-attempt-mutation";
import { useTransferQuery } from "@/features/diagnostic/hooks/use-transfer-query";
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

export function TransferPlayerView(): JSX.Element {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const transferQuery = useTransferQuery(sessionId);
  const submitMutation = useSubmitTransferAttemptMutation();
  const submitAbortControllerRef = useRef<AbortController | null>(null);
  const currentClientAttemptIdRef = useRef<string | null>(null);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackResponse, setFeedbackResponse] =
    useState<SubmitTransferAttemptResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const transferData = transferQuery.data;
  const currentQuestionId = transferData?.currentQuestion?.id ?? null;

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
    const apiError = getApiError(transferQuery.error);

    if (!apiError || !isLearningSessionExpired(apiError)) {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, navigate, transferQuery.error]);

  async function handleSubmit(): Promise<void> {
    if (!transferData?.currentQuestion || !selectedOptionId || submitMutation.isPending) {
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
          questionId: transferData.currentQuestion.id,
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
        ? getLearningSubmitMessage("transfer", apiError)
        : {
            title: "Chưa gửi được câu trả lời",
            description:
              "Chưa thể kết nối đến máy chủ Mina trong trường. Câu trả lời của em chưa được gửi. Hãy thử lại.",
          };

      setSubmitError(message.description);
    }
  }

  async function handleNextQuestion(): Promise<void> {
    setFeedbackResponse(null);
    setSubmitError(null);
    setSelectedOptionId(null);

    await queryClient.invalidateQueries({
      queryKey: queryKeys.diagnostic.transfer(sessionId),
    });
  }

  if (transferQuery.isPending) {
    return <DiagnosticSessionSkeleton />;
  }

  if (transferQuery.isError) {
    const apiError = getApiError(transferQuery.error);
    const message = apiError
      ? getLearningLoadMessage(apiError, "transfer")
      : {
          title: "Chưa thể tải phần kiểm tra lại",
          description:
            "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để tiếp tục phần kiểm tra lại.",
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
            queryKey: queryKeys.diagnostic.transfer(sessionId),
          });
        }}
      />
    );
  }

  if (!transferData) {
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
            Kiểm tra lại
          </p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
            {transferData.assignmentTitle}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Em làm lần lượt từng câu để Mina kiểm tra lại phần kiến thức vừa củng cố.
          </p>
        </div>

        <DiagnosticProgress progress={transferData.progress} ariaLabel="Tiến độ kiểm tra lại" />
      </header>

      {transferData.currentQuestion ? (
        <DiagnosticQuestionForm
          question={transferData.currentQuestion}
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
