import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button.variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export type PagePlaceholderProps = {
  title: string;
  description: string;
  backLink?: string;
};

export function PagePlaceholder({
  title,
  description,
  backLink,
}: PagePlaceholderProps): JSX.Element {
  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="items-start gap-4">
        <div className="rounded-full bg-[var(--primary-subtle)] p-3">
          <FileText aria-hidden="true" className="size-6 text-[var(--primary)]" />
        </div>
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
      </CardHeader>
      {backLink ? (
        <CardContent>
          <Link
            to={backLink}
            className={cn(buttonVariants({ variant: "secondary" }), "no-underline")}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span>Quay lại</span>
          </Link>
        </CardContent>
      ) : null}
    </Card>
  );
}
