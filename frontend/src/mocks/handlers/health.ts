import { HttpResponse, http } from "msw";

const healthSuccessPayload = {
  status: "ok" as const,
  service: "frontend-mock",
};

export const healthHandlers = [
  http.get("/api/v1/health", ({ request }) => {
    const url = new URL(request.url);

    if (url.searchParams.get("scenario") === "error") {
      return HttpResponse.json(
        {
          code: "mock_health_unavailable",
          message: "Dịch vụ mock hiện không khả dụng.",
        },
        { status: 503 },
      );
    }

    return HttpResponse.json(healthSuccessPayload);
  }),
];
