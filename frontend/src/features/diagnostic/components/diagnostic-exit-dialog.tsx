import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type DiagnosticExitDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ];

  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(",")));
}

export function DiagnosticExitDialog({
  open,
  onClose,
  onConfirm,
}: DiagnosticExitDialogProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElement.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const firstFocusable = dialogRef.current
      ? getFocusableElements(dialogRef.current)[0]
      : null;
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (!dialogRef.current) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = getFocusableElements(dialogRef.current);

      if (focusables.length === 0) {
        return;
      }

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(22,49,58,0.28)] px-4 py-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostic-exit-title"
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle id="diagnostic-exit-title">Em có muốn rời bài đang làm không?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-secondary)]">
              Tiến trình đã lưu trên máy chủ Mina trong trường sẽ không bị mất.
            </p>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Tiếp tục làm bài
            </Button>
            <Button type="button" onClick={onConfirm}>
              Rời bài
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
