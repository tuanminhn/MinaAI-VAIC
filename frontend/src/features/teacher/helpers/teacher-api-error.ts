import { isApiError } from "@/lib/api/api-error";
import { HttpRequestError } from "@/lib/api/http-client";

export function getTeacherApiError(error: unknown) {
  if (error instanceof HttpRequestError) {
    return error.apiError;
  }

  return isApiError(error) ? error : null;
}
