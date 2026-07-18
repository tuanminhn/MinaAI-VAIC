import { RouterProvider } from "react-router-dom";
import { AppErrorBoundary } from "@/app/error-boundary/app-error-boundary";
import { AppProviders } from "@/app/providers/app-providers";
import { createAppRouter } from "@/app/router/router";

const router = createAppRouter();

export function App(): JSX.Element {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  );
}
