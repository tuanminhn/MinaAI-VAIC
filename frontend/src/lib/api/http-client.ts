import { createApiError, type ApiError } from "@/lib/api/api-error";
import { getApiBaseUrl } from "@/lib/api/config";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: BodyInit | Record<string, unknown> | null;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export class HttpRequestError extends Error {
  public readonly apiError: ApiError;

  public constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = "HttpRequestError";
    this.apiError = apiError;
  }
}

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<unknown>;
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

function normalizeError(response: Response, payload: unknown): ApiError {
  if (typeof payload === "object" && payload !== null) {
    const maybeError = payload as {
      code?: string;
      message?: string;
      fieldErrors?: Record<string, string[]>;
    };

    return createApiError({
      status: response.status,
      code: maybeError.code ?? `http_${response.status}`,
      message: maybeError.message ?? (response.statusText || "Đã xảy ra lỗi từ máy chủ."),
      fieldErrors: maybeError.fieldErrors,
    });
  }

  if (typeof payload === "string" && payload.length > 0) {
    return createApiError({
      status: response.status,
      code: `http_${response.status}`,
      message: payload,
    });
  }

  return createApiError({
    status: response.status,
    code: `http_${response.status}`,
    message: response.statusText || "Đã xảy ra lỗi từ máy chủ.",
  });
}

export async function httpRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { body, headers, method = "GET", signal } = options;
  const requestHeaders = new Headers(headers);

  let requestBody: BodyInit | undefined;

  if (
    body &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    typeof body === "object"
  ) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  } else if (body) {
    requestBody = body;
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: requestBody,
      credentials: "include",
      signal,
    });
  } catch (error) {
    throw new HttpRequestError(
      createApiError({
        status: 0,
        code: "network_error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể kết nối đến máy chủ Mina trong trường.",
      }),
    );
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new HttpRequestError(normalizeError(response, payload));
  }

  return payload as TResponse;
}
