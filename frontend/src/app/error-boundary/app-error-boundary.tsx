import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled app error", error, errorInfo);
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-6xl px-4 py-8">
          <AppErrorFallback onRetry={this.handleRetry} />
        </main>
      );
    }

    return this.props.children;
  }
}
