import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { resetDiagnosticFixtureState } from "@/fixtures/diagnostic";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetDiagnosticFixtureState();
  server.resetHandlers();
});

afterAll(() => server.close());
