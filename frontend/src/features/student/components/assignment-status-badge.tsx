import { BookOpenCheck, CircleCheckBig, Clock3, RefreshCw, TriangleAlert } from "lucide-react";
import type { AssignmentStatus } from "@/contracts/student";
import { Badge } from "@/components/ui/badge";
import { getAssignmentPresentation } from "@/features/student/lib/assignment-presentation";

type AssignmentStatusBadgeProps = {
  status: AssignmentStatus;
};

function getStatusIcon(status: AssignmentStatus): JSX.Element {
  switch (status) {
    case "not_started":
      return <Clock3 aria-hidden="true" className="size-4" />;
    case "in_progress":
      return <RefreshCw aria-hidden="true" className="size-4" />;
    case "remediation":
      return <TriangleAlert aria-hidden="true" className="size-4" />;
    case "transfer_ready":
      return <BookOpenCheck aria-hidden="true" className="size-4" />;
    case "completed":
      return <CircleCheckBig aria-hidden="true" className="size-4" />;
  }
}

export function AssignmentStatusBadge({
  status,
}: AssignmentStatusBadgeProps): JSX.Element {
  const presentation = getAssignmentPresentation(status);

  return (
    <Badge variant={presentation.badgeVariant} className="gap-1.5">
      {getStatusIcon(status)}
      <span>{presentation.statusLabel}</span>
    </Badge>
  );
}
