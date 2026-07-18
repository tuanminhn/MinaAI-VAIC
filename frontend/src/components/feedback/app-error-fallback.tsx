import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AppErrorFallbackProps = {
  onRetry?: () => void;
  title?: string;
  description?: string;
};

export function AppErrorFallback({
  onRetry,
  title = "Đã xảy ra lỗi",
  description = "Mina AI chưa thể hiển thị nội dung này. Bạn có thể thử lại.",
}: AppErrorFallbackProps): JSX.Element {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <AlertTriangle aria-hidden="true" className="size-6 text-[var(--error)]" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
          {onRetry ? <Button onClick={onRetry}>Thử lại</Button> : null}
        </CardContent>
      </Card>
    </div>
  );
}
