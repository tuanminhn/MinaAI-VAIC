import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { shouldEnableMsw } from "@/mocks/config";
import "@/styles/index.css";

void (async () => {
  if (shouldEnableMsw({ isDev: import.meta.env.DEV, enableMsw: import.meta.env.VITE_ENABLE_MSW })) {
    const { enableMocking } = await import("@/mocks/browser");
    await enableMocking();
  }

  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Root container not found.");
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();
