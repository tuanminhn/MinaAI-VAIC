import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { AssignmentSummary } from "@/contracts/student";
import { buttonVariants } from "@/components/ui/button.variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { AssignmentStatusBadge } from "@/features/student/components/assignment-status-badge";
import { LearningProgress } from "@/features/student/components/learning-progress";
import { formatEstimatedMinutes } from "@/features/student/lib/format-assignment-meta";
import { getAssignmentPresentation } from "@/features/student/lib/assignment-presentation";
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
  const presentation = getAssignmentPresentation(assignment.status);
  const estimatedMinutes = formatEstimatedMinutes(assignment.estimatedMinutes);
  const HeadingTag = headingLevel;

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
      ) : null}
    </Card>
  );
}
