import { authHandlers } from "@/mocks/handlers/auth";
import { diagnosticHandlers } from "@/mocks/handlers/diagnostic";
import { healthHandlers } from "@/mocks/handlers/health";
import { studentHandlers } from "@/mocks/handlers/student";
import { teacherHandlers } from "@/mocks/handlers/teacher";

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...studentHandlers,
  ...diagnosticHandlers,
  ...teacherHandlers,
];
