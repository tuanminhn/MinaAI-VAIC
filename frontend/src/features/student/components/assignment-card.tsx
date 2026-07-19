import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { AssignmentSummary } from "@/contracts/student";
import { buttonVariants } from "@/components/ui/button.variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useStartDiagnosticSessionMutation } from "@/features/student/hooks/use-start-diagnostic-session-mutation";
import { AssignmentStatusBadge } from "@/features/student/components/assignment-status-badge";
import { LearningProgress } from "@/features/student/components/learning-progress";
import { formatEstimatedMinutes } from "@/features/student/lib/format-assignment-meta";
import { getAssignmentPresentation } from "@/features/student/lib/assignment-presentation";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils/cn";

type AssignmentCardProps = {
  assignment: AssignmentSummary;
  headingLevel?: "h2" | "h3";
  emphasized?: boolean;
};

export function AssignmentCard({
  assignment,
  headingLevel = "h2",
  emphasized = false,
}: AssignmentCardProps): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const startMutation = useStartDiagnosticSessionMutation();
  const startAbortControllerRef = useRef<AbortController | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const presentation = getAssignmentPresentation(assignment.status);
  const estimatedMinutes = formatEstimatedMinutes(assignment.estimatedMinutes);
  const HeadingTag = headingLevel;

  async function handleStartDiagnostic(): Promise<void> {
    if (!assignment.diagnosticAvailable || assignment.nextRoute || startMutation.isPending) {
      return;
    }

    startAbortControllerRef.current?.abort();
    startAbortControllerRef.current = new AbortController();
    setStartError(null);

    try {
      const response = await startMutation.mutateAsync({
        assignmentId: assignment.id,
        signal: startAbortControllerRef.current.signal,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.home() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.assignments(undefined, 1, 10),
        }),
      ]);

      navigate(response.route);
    } catch {
      setStartError(
        "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy kiểm tra Wi-Fi nội bộ hoặc thử lại.",
      );
    }
  }

  return (
    <Card variant={emphasized ? "student-focus" : "default"} className="h-full">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <AssignmentStatusBadge status={assignment.status} />
            <div className="space-y-1">
              <HeadingTag className="text-xl font-semibold text-[var(--text-primary)]">
                {assignment.title}
              </HeadingTag>
              {assignment.description ? (
                <CardDescription>{assignment.description}</CardDescription>
              ) : null}
            </div>
          </div>
          <div className="rounded-[var(--radius-pill)] bg-[var(--primary-subtle)] px-3 py-1 text-sm font-medium text-[var(--primary-subtle-foreground)]">
            Toán lớp {assignment.grade}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LearningProgress
          completed={assignment.progress.completed}
          total={assignment.progress.total}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
          {estimatedMinutes ? <p>{estimatedMinutes}</p> : null}
          {assignment.dueAt ? <p>Hạn nộp: {assignment.dueAt}</p> : null}
        </div>
      </CardContent>
      {assignment.nextRoute ? (
        <CardFooter>
          <Link
            to={assignment.nextRoute}
            aria-label={`${presentation.actionLabel} ${assignment.title}`}
            className={cn(
              buttonVariants({
                size: emphasized ? "lg" : "default",
              }),
              "no-underline",
            )}
          >
            <span>{presentation.actionLabel}</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </CardFooter>
      ) : assignment.diagnosticAvailable ? (
        <CardFooter className="flex-col items-start gap-3">
          <button
            type="button"
            aria-label={`${presentation.actionLabel} ${assignment.title}`}
            className={cn(
              buttonVariants({
                size: emphasized ? "lg" : "default",
              }),
              "no-underline",
            )}
            disabled={startMutation.isPending}
            onClick={() => {
              void handleStartDiagnostic();
            }}
          >
            <span>{presentation.actionLabel}</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
          {startError ? (
            <p role="alert" className="text-sm text-[var(--error)]">
              {startError}
            </p>
          ) : null}
        </CardFooter>
      ) : (
        <CardFooter>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Bài học đang được chuẩn bị.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
