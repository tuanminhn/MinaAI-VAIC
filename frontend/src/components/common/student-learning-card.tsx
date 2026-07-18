import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type StudentLearningCardProps = {
  title: string;
  description: string;
  actionLabel: string;
};

export function StudentLearningCard({
  title,
  description,
  actionLabel,
}: StudentLearningCardProps): JSX.Element {
  return (
    <Card variant="student-focus">
      <CardHeader className="space-y-2">
        <div className="inline-flex w-fit rounded-[var(--radius-pill)] bg-[var(--card-student-accent)] px-3 py-1 text-sm font-medium text-[var(--primary-subtle-foreground)]">
          Student focus
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="lg">
          {actionLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
