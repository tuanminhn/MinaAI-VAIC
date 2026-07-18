import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { SubmitDiagnosticAttemptResponse } from "@/contracts/diagnostic";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button.variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { DiagnosticExitDialog } from "@/features/diagnostic/components/diagnostic-exit-dialog";
import { DiagnosticFeedbackPanel } from "@/features/diagnostic/components/diagnostic-feedback-panel";
import { DiagnosticProgress } from "@/features/diagnostic/components/diagnostic-progress";
import { DiagnosticQuestionForm } from "@/features/diagnostic/components/diagnostic-question-form";
import { DiagnosticSessionSkeleton } from "@/features/diagnostic/components/diagnostic-session-skeleton";
import {
  getDiagnosticLoadMessage,
  getDiagnosticSubmitMessage,
  isDiagnosticSessionExpired,
  isDiagnosticSessionMissing,
} from "@/features/diagnostic/helpers/diagnostic-error-messages";
import { getDiagnosticSessionRouteLabel } from "@/features/diagnostic/helpers/diagnostic-session-presentation";
import { useDiagnosticSessionQuery } from "@/features/diagnostic/hooks/use-diagnostic-session-query";
import { useSubmitDiagnosticAttemptMutation } from "@/features/diagnostic/hooks/use-submit-diagnostic-attempt-mutation";
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

export function DiagnosticPlayerView(): JSX.Element {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const sessionQuery = useDiagnosticSessionQuery(sessionId);
  const submitMutation = useSubmitDiagnosticAttemptMutation();
  const submitAbortControllerRef = useRef<AbortController | null>(null);
  const currentClientAttemptIdRef = useRef<string | null>(null);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackResponse, setFeedbackResponse] = useState<SubmitDiagnosticAttemptResponse | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  const sessionData = sessionQuery.data;
  const currentQuestionId = sessionData?.currentQuestion?.id ?? null;

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
    const apiError = getApiError(sessionQuery.error);

    if (!apiError || !isDiagnosticSessionExpired(apiError)) {
      return;
    }

    auth.resetSession(getSessionRestoreNotice(apiError));
    navigate("/login", { replace: true });
  }, [auth, navigate, sessionQuery.error]);

  const hasInteraction = useMemo(
    () => selectedOptionId !== null || feedbackResponse !== null,
    [feedbackResponse, selectedOptionId],
  );

  async function handleSubmit(): Promise<void> {
    if (!sessionData?.currentQuestion || !selectedOptionId || submitMutation.isPending) {
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
          questionId: sessionData.currentQuestion.id,
          selectedOptionId,
          clientAttemptId: currentClientAttemptIdRef.current,
        },
        signal: submitAbortControllerRef.current.signal,
      });

      setFeedbackResponse(response);
    } catch (error) {
      const apiError = getApiError(error);

      if (apiError && isDiagnosticSessionExpired(apiError)) {
        auth.resetSession(getSessionRestoreNotice(apiError));
        navigate("/login", { replace: true });
        return;
      }

      const message = apiError
        ? getDiagnosticSubmitMessage(apiError)
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
      queryKey: queryKeys.diagnostic.session(sessionId),
    });
  }

  function handleExitAttempt(): void {
    if (!hasInteraction) {
      navigate("/student/assignments");
      return;
    }

    setIsExitDialogOpen(true);
  }

  if (sessionQuery.isPending) {
    return <DiagnosticSessionSkeleton />;
  }

  if (sessionQuery.isError) {
    const apiError = getApiError(sessionQuery.error);
    const message = apiError
      ? getDiagnosticLoadMessage(apiError)
      : {
          title: "Chưa thể tải phiên làm bài",
          description:
            "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để mở lại bài đang làm.",
        };

    if (apiError && isDiagnosticSessionMissing(apiError)) {
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
            queryKey: queryKeys.diagnostic.session(sessionId),
          });
        }}
      />
    );
  }

  if (!sessionData) {
    return <></>;
  }

  if (!sessionData.currentQuestion) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/student/assignments"
            className={cn(buttonVariants({ variant: "secondary" }), "no-underline")}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Quay về Bài được giao
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Mina AI
            </p>
            <CardTitle className="text-2xl">{sessionData.assignmentTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DiagnosticProgress progress={sessionData.progress} />
            <p className="text-sm text-[var(--text-secondary)]">
              Phiên làm bài này đã sẵn sàng cho bước tiếp theo.
            </p>
            {sessionData.nextRoute ? (
              <Link
                to={sessionData.nextRoute}
                className={cn(buttonVariants({ variant: "primary" }), "no-underline")}
              >
                {getDiagnosticSessionRouteLabel(sessionData)}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/student/assignments"
              className={cn(buttonVariants({ variant: "secondary" }), "no-underline")}
              onClick={(event) => {
                if (hasInteraction) {
                  event.preventDefault();
                  handleExitAttempt();
                }
              }}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Thoát bài
            </Link>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Bài chẩn đoán
            </p>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
              {sessionData.assignmentTitle}
            </h1>
          </div>

          <DiagnosticProgress progress={sessionData.progress} />
        </header>

        <DiagnosticQuestionForm
          question={sessionData.currentQuestion}
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

        {feedbackResponse ? (
          <DiagnosticFeedbackPanel
            response={feedbackResponse}
            onContinue={() => {
              void handleNextQuestion();
            }}
          />
        ) : null}
      </div>

      <DiagnosticExitDialog
        open={isExitDialogOpen}
        onClose={() => setIsExitDialogOpen(false)}
        onConfirm={() => {
          setIsExitDialogOpen(false);
          navigate("/student/assignments");
        }}
      />
    </>
  );
}
