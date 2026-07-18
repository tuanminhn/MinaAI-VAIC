import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { SubmitDiagnosticAttemptResponse } from "@/contracts/diagnostic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils/cn";

type DiagnosticFeedbackPanelProps = {
  response: SubmitDiagnosticAttemptResponse;
  onContinue?: () => void;
};

function getFeedbackIcon(tone: SubmitDiagnosticAttemptResponse["feedback"]["tone"]): JSX.Element {
  if (tone === "encouraging") {
    return <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />;
  }

  return <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />;
}

export function DiagnosticFeedbackPanel({
  response,
  onContinue,
}: DiagnosticFeedbackPanelProps): JSX.Element {
  const nextAction = response.nextAction;

  return (
    <div aria-live="polite" className="space-y-4">
      <Alert variant={response.feedback.tone === "encouraging" ? "success" : "info"}>
        <div className="flex items-start gap-3">
          {getFeedbackIcon(response.feedback.tone)}
          <div>
            <AlertTitle>{response.feedback.title}</AlertTitle>
            <AlertDescription>{response.feedback.message}</AlertDescription>
          </div>
        </div>
      </Alert>

      {nextAction.type === "next_question" ? (
        <Button type="button" onClick={onContinue}>
          {nextAction.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      ) : (
        <Link
          to={nextAction.route}
          className={cn(buttonVariants({ variant: "primary" }), "no-underline")}
        >
          {nextAction.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}
