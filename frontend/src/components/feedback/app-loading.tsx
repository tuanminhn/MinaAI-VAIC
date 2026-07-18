import { LoaderCircle } from "lucide-react";

export type AppLoadingProps = {
  message?: string;
};

export function AppLoading({ message = "Đang tải nội dung..." }: AppLoadingProps): JSX.Element {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-8 animate-spin text-[var(--primary)] motion-reduce:animate-none"
      />
      <p className="text-sm font-medium text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}
