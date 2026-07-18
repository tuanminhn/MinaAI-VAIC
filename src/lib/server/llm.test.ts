import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateStructured } from "./llm";

const envKeys = [
  "LLM_ENABLED", "LLM_BASE_URL", "LLM_API_KEY", "LLM_MODEL",
  "LLM_TIMEOUT_MS", "LLM_MAX_TOKENS", "LLM_MAX_RETRIES",
] as const;
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of envKeys) {
    const original = originalEnv[key];
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

describe("FPT AI structured generation", () => {
  it("uses the FPT endpoint and DeepSeek-V4-Flash defaults", async () => {
    process.env.LLM_API_KEY = "test-key";
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_MODEL;
    process.env.LLM_MAX_RETRIES = "0";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "```json\n{\"answer\":\"ổn\"}\n```" } }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateStructured({
      task: "test",
      system: "system",
      schema: { answer: "string" },
      context: { approved: true },
      fallback: { answer: "fallback" },
      validate: (value): value is { answer: string } => Boolean(value && typeof value === "object" && typeof (value as { answer?: unknown }).answer === "string"),
      requiresTeacherApproval: false,
    });

    expect(result.content).toEqual({ answer: "ổn" });
    expect(result.ai).toMatchObject({ mode: "llm", provider: "mkp-api.fptcloud.com", model: "DeepSeek-V4-Flash" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://mkp-api.fptcloud.com/chat/completions");
    expect(request.headers).toMatchObject({ authorization: "Bearer test-key", "content-type": "application/json" });
    expect(JSON.parse(String(request.body))).toMatchObject({ model: "DeepSeek-V4-Flash", max_tokens: 1600, stream: false });
  });

  it("retries a transient provider failure once", async () => {
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_MAX_RETRIES = "1";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "{\"answer\":\"ok\"}" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateStructured({
      task: "test",
      system: "system",
      schema: { answer: "string" },
      context: {},
      fallback: { answer: "fallback" },
      validate: (value): value is { answer: string } => Boolean(value && typeof value === "object" && typeof (value as { answer?: unknown }).answer === "string"),
      requiresTeacherApproval: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.ai.mode).toBe("llm");
  });

  it("uses the local fallback without sending a request when the key is missing", async () => {
    delete process.env.LLM_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateStructured({
      task: "test",
      system: "system",
      schema: { answer: "string" },
      context: {},
      fallback: { answer: "fallback" },
      validate: (value): value is { answer: string } => Boolean(value),
      requiresTeacherApproval: false,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ content: { answer: "fallback" }, ai: { mode: "fallback", reason: "not_configured" } });
  });
});
