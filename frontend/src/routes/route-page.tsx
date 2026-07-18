import { PagePlaceholder } from "@/components/feedback/page-placeholder";

export type RoutePageProps = {
  title: string;
  description: string;
  backLink?: string;
};

export function RoutePage({ title, description, backLink }: RoutePageProps): JSX.Element {
  return <PagePlaceholder title={title} description={description} backLink={backLink} />;
}
