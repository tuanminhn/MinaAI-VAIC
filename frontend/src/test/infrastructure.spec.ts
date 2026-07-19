import path from "node:path";
import { readFileSync } from "node:fs";
import { HttpRequestError, httpRequest } from "@/lib/api/http-client";
import { shouldEnableMsw } from "@/mocks/config";

describe("infrastructure guards", () => {
  it("does not enable MSW in production configuration", () => {
    expect(shouldEnableMsw({ isDev: false, enableMsw: "true" })).toBe(false);
    expect(shouldEnableMsw({ isDev: true, enableMsw: "false" })).toBe(false);
    expect(shouldEnableMsw({ isDev: true, enableMsw: undefined })).toBe(false);
  });

  it("does not fall back to fixture data when the API returns an error", async () => {
    await expect(httpRequest("/health?scenario=error")).rejects.toBeInstanceOf(HttpRequestError);
  });

  it("sends cookie credentials with API requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await httpRequest("/health");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("does not keep auth tokens in the auth provider source", () => {
    const authProviderPath = path.resolve(process.cwd(), "src/features/auth/hooks/auth-provider.tsx");
    const authProviderSource = readFileSync(authProviderPath, "utf8");

    expect(authProviderSource).not.toContain("localStorage");
    expect(authProviderSource).not.toContain("accessToken");
  });

  it("stores shell labels with full Vietnamese accents in source files", () => {
    const studentShellPath = path.resolve(process.cwd(), "src/features/auth/components/student-shell.tsx");
    const teacherShellPath = path.resolve(process.cwd(), "src/features/auth/components/teacher-shell.tsx");

    const studentShellSource = readFileSync(studentShellPath, "utf8");
    const teacherShellSource = readFileSync(teacherShellPath, "utf8");

    expect(studentShellSource).toContain("Trang chính");
    expect(studentShellSource).toContain("Bài được giao");
    expect(teacherShellSource).toContain("Tổng quan");
    expect(teacherShellSource).toContain("Lớp học");
    expect(teacherShellSource).toContain("Nhóm hỗ trợ");
    expect(teacherShellSource).toContain("Can thiệp");
  });
});
