export function SkipLink(): JSX.Element {
  return (
    <a
      href="#main-content"
      className="absolute left-4 top-4 z-50 -translate-y-24 rounded-[var(--radius-base)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] no-underline motion-standard focus:translate-y-0"
    >
      Bỏ qua điều hướng
    </a>
  );
}
