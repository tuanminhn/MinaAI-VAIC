import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TeacherDataSurfaceProps = {
  title: string;
  rows: Array<{ label: string; value: string }>;
};

export function TeacherDataSurface({
  title,
  rows,
}: TeacherDataSurfaceProps): JSX.Element {
  return (
    <Card variant="teacher-compact">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-[var(--teacher-surface-divider)] pb-3 last:border-b-0 last:pb-0"
          >
            <span className="text-sm text-[var(--text-secondary)]">{row.label}</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
