import fs from "node:fs";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, InputMessage } from "@/components/ui/input";
import { renderApp } from "@/test/render-app";

describe("design tokens and brand foundation", () => {
  it("renders button variants with token-based classes", () => {
    render(
      <div>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Primary" }).className).toContain(
      "--button-primary-bg",
    );
    expect(screen.getByRole("button", { name: "Secondary" }).className).toContain(
      "--button-secondary-bg",
    );
    expect(screen.getByRole("button", { name: "Destructive" }).className).toContain(
      "--button-destructive-bg",
    );
  });

  it("supports keyboard focus on button", async () => {
    const user = userEvent.setup();
    render(<Button>Tiếp tục</Button>);
    await user.tab();
    expect(screen.getByRole("button", { name: /Tiếp tục|Tiep tuc/i })).toHaveFocus();
  });

  it("exposes invalid input message semantics", () => {
    render(
      <div>
        <Input invalid aria-describedby="input-error" />
        <InputMessage id="input-error">Thông tin chưa hợp lệ.</InputMessage>
      </div>,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-describedby", "input-error");
    expect(screen.getByRole("alert")).toHaveTextContent(/Thông tin chưa hợp lệ|Thong tin chua hop le/i);
  });

  it("renders alert with role and heading", () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Lưu ý</AlertTitle>
        <AlertDescription>Kiểm tra lại thông tin trước khi tiếp tục.</AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Lưu ý|Luu y/i })).toBeInTheDocument();
  });

  it("shows the design system preview in development routes", async () => {
    renderApp(["/dev/design-system"], { includeDevRoutes: true });
    await waitFor(() =>
      expect(screen.getByText("Mina AI Design System")).toBeInTheDocument(),
    );
  });

  it("does not expose the design system preview in production routes", async () => {
    renderApp(["/dev/design-system"], { includeDevRoutes: false });
    await waitFor(() =>
      expect(
        screen.getByText(/Không tìm thấy trang|Khong tim thay trang/i),
      ).toBeInTheDocument(),
    );
  });

  it("has no serious accessibility violations on the design system preview", async () => {
    const { container } = renderApp(["/dev/design-system"], { includeDevRoutes: true });
    await waitFor(() =>
      expect(screen.getByText("Mina AI Design System")).toBeInTheDocument(),
    );

    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toHaveLength(0);
  });

  it("includes reduced motion CSS", () => {
    const cssPath = path.resolve(process.cwd(), "src/styles/utilities.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("does not use raw hex colors in component, route, or feature source files", () => {
    const directories = [
      path.resolve(process.cwd(), "src/components"),
      path.resolve(process.cwd(), "src/routes"),
      path.resolve(process.cwd(), "src/features"),
    ];

    const matches: string[] = [];
    const hexPattern = /#[0-9A-Fa-f]{3,8}\b/g;

    const visit = (directory: string) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          visit(fullPath);
          continue;
        }

        if (!/\.(ts|tsx)$/.test(entry.name)) {
          continue;
        }

        const content = fs.readFileSync(fullPath, "utf-8");
        if (hexPattern.test(content)) {
          matches.push(fullPath);
        }
      }
    };

    directories.forEach(visit);
    expect(matches).toEqual([]);
  });
});
