const defaultBaseUrl = "/api/v1";

export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  return typeof baseUrl === "string" && baseUrl.length > 0 ? baseUrl : defaultBaseUrl;
}
