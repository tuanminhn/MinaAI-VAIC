import { healthSchema, type HealthResponse } from "@/contracts/health";
import { httpRequest } from "@/lib/api/http-client";

export const healthRepository = {
  async get(signal?: AbortSignal): Promise<HealthResponse> {
    const response = await httpRequest<unknown>("/health", { signal });
    return healthSchema.parse(response);
  },
};
