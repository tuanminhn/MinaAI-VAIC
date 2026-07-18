export type ApiError = {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function createApiError(
  partial: Partial<ApiError> & Pick<ApiError, "message">,
): ApiError {
  return {
    status: partial.status ?? 500,
    code: partial.code ?? "unknown_error",
    message: partial.message,
    fieldErrors: partial.fieldErrors,
  };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "code" in value &&
    "message" in value
  );
}
