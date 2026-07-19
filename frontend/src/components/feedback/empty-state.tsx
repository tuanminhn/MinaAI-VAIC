import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: EmptyStateAction;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: EmptyStateProps): JSX.Element {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        {Icon ? (
          <div className="mb-3 rounded-full bg-[var(--primary-subtle)] p-3">
            <Icon aria-hidden="true" className="size-6 text-[var(--primary)]" />
          </div>
        ) : null}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        {action ? (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
