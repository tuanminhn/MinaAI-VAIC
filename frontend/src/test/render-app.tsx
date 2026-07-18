import { render } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { AppErrorBoundary } from "@/app/error-boundary/app-error-boundary";
import type { BuildRoutesOptions } from "@/app/router/router";
import { AppProviders } from "@/app/providers/app-providers";
import { createTestRouter } from "@/app/router/router";

export function renderApp(
  initialEntries: string[] = ["/login"],
  options: BuildRoutesOptions = { includeDevRoutes: true },
) {
  const router = createTestRouter(initialEntries, options);

  return render(
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>,
  );
}
