import "server-only";
import type { AiMeta } from "@/lib/ai/contracts";

type GenerateInput<T> = {
  task: string;
  system: string;
  schema: unknown;
  context: unknown;
  fallback: T;
  validate: (value: unknown) => value is T;
  requiresTeacherApproval: boolean;
};

const FPT_DEFAULT_BASE_URL = "https://mkp-api.fptcloud.com";
const FPT_DEFAULT_MODEL = "DeepSeek-V4-Flash";

function completionUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

export async function generateStructured<T>(input: GenerateInput<T>): Promise<{ content: T; ai: AiMeta }> {
  const enabled = process.env.LLM_ENABLED !== "false";
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || FPT_DEFAULT_MODEL;
  const baseUrl = process.env.LLM_BASE_URL || FPT_DEFAULT_BASE_URL;
  const timeoutMs = boundedInteger(process.env.LLM_TIMEOUT_MS, 30_000, 1_000, 60_000);
  const maxTokens = boundedInteger(process.env.LLM_MAX_TOKENS, 1_600, 256, 4_096);
  const maxRetries = boundedInteger(process.env.LLM_MAX_RETRIES, 1, 0, 2);
  const fallbackMeta = (reason: AiMeta["reason"]): AiMeta => ({
    mode: "fallback", provider: "local", model: "deterministic-v1", grounded: true,
    requiresTeacherApproval: input.requiresTeacherApproval, reason,
  });
  if (!enabled) return { content: input.fallback, ai: fallbackMeta("disabled") };
  if (!apiKey) return { content: input.fallback, ai: fallbackMeta("not_configured") };

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(completionUrl(baseUrl), {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: maxTokens,
          stream: false,
          messages: [
            { role: "system", content: `${input.system}\nChỉ trả về một JSON object hợp lệ, không markdown. Giữ chính xác tên key, kiểu dữ liệu và cấu trúc lồng nhau trong required_output_schema.` },
            { role: "user", content: JSON.stringify({ task: input.task, required_output_schema: input.schema, approved_anonymized_context: input.context }) },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < maxRetries) continue;
        return { content: input.fallback, ai: fallbackMeta("provider_error") };
      }
      const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
      const raw = payload.choices?.[0]?.message?.content?.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      if (!raw) return { content: input.fallback, ai: fallbackMeta("invalid_output") };
      const parsed: unknown = JSON.parse(raw);
      if (!input.validate(parsed)) return { content: input.fallback, ai: fallbackMeta("invalid_output") };
      return {
        content: parsed,
        ai: { mode: "llm", provider: new URL(baseUrl).hostname, model, grounded: true, requiresTeacherApproval: input.requiresTeacherApproval },
      };
    } catch {
      if (attempt === maxRetries) return { content: input.fallback, ai: fallbackMeta("provider_error") };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { content: input.fallback, ai: fallbackMeta("provider_error") };
}
