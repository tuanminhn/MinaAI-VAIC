import { type PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createQueryClient } from "@/lib/query/query-client";

export type TestProvidersProps = PropsWithChildren<{
  initialEntries?: string[];
}>;

export function TestProviders({
  children,
  initialEntries = ["/"],
}: TestProvidersProps): JSX.Element {
  const queryClient = createQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <TooltipProvider>{children}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
