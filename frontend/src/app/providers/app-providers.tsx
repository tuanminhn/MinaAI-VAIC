import { type PropsWithChildren, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppToast } from "@/components/common/app-toast";
import { AuthProvider } from "@/features/auth/hooks/auth-provider";
import { createQueryClient } from "@/lib/query/query-client";

export function AppProviders({ children }: PropsWithChildren): JSX.Element {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {children}
          <AppToast />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
