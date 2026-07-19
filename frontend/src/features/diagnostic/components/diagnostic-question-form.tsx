import { useId } from "react";
import type { DiagnosticQuestion } from "@/contracts/diagnostic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type DiagnosticQuestionFormProps = {
  question: DiagnosticQuestion;
  selectedOptionId: string | null;
  disabled?: boolean;
  submitError?: string | null;
  isSubmitting?: boolean;
  onOptionChange: (optionId: string) => void;
  onSubmit: () => void;
};

export function DiagnosticQuestionForm({
  question,
  selectedOptionId,
  disabled = false,
  submitError,
  isSubmitting = false,
  onOptionChange,
  onSubmit,
}: DiagnosticQuestionFormProps): JSX.Element {
  const errorId = useId();

  return (
    <Card variant="student-focus">
      <CardHeader>
        <fieldset
          aria-describedby={submitError ? errorId : undefined}
          className="space-y-4"
          disabled={disabled}
        >
          <legend className="text-xl font-semibold text-[var(--text-primary)]">
            {question.prompt}
          </legend>

          <div className="space-y-3">
            {question.options.map((option) => {
              const inputId = `diagnostic-option-${question.id}-${option.id}`;

              return (
                <label
                  key={option.id}
                  htmlFor={inputId}
                  className="motion-standard flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[var(--radius-base)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--border-strong)]"
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={`diagnostic-question-${question.id}`}
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    onChange={() => onOptionChange(option.id)}
                    className="size-4 accent-[var(--primary)]"
                    disabled={disabled}
                  />
                  <span className="text-base text-[var(--text-primary)]">{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </CardHeader>

      <CardContent className="space-y-4">
        {submitError ? (
          <p id={errorId} className="text-sm text-[var(--error)]" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          disabled={!selectedOptionId || disabled}
          isLoading={isSubmitting}
          loadingLabel="Đang gửi câu trả lời"
          onClick={onSubmit}
        >
          Nộp câu trả lời
        </Button>
      </CardContent>
    </Card>
  );
}
