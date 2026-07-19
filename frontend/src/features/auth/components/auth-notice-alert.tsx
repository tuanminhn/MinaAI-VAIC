import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuthNotice } from "@/features/auth/types/auth-notice";

const alertVariantMap = {
  error: "error",
  warning: "warning",
  info: "info",
} as const;

export function AuthNoticeAlert({ notice }: { notice: AuthNotice }): JSX.Element {
  return (
    <Alert variant={alertVariantMap[notice.variant]}>
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.message}</AlertDescription>
    </Alert>
  );
}
