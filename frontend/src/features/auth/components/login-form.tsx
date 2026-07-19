import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, School } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, InputDescription, InputMessage } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthNoticeAlert } from "@/features/auth/components/auth-notice-alert";
import { getLoginNotice } from "@/features/auth/hooks/auth-error-messages";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";
import { useLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import {
  type LoginFormValues,
} from "@/features/auth/schemas/login-schema";
import type { AuthNotice } from "@/features/auth/types/auth-notice";
import { HttpRequestError } from "@/lib/api/http-client";

function getHomeRoute(role: "student" | "teacher"): string {
  return role === "teacher" ? "/teacher" : "/student";
}

export function LoginForm(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const loginMutation = useLoginMutation();
  const form = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState<AuthNotice | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);

  const usernameField = form.register("username");
  const passwordField = form.register("password");

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (loginMutation.isPending) {
      setSubmissionNotice(null);
    }
  }, [loginMutation.isPending]);

  async function handleSubmit(values: LoginFormValues) {
    auth.clearNotice();
    setSubmissionNotice(null);

    try {
      const session = await loginMutation.mutateAsync(values);
      form.reset({
        username: values.username.trim(),
        password: "",
      });
      navigate(getHomeRoute(session.user.role), { replace: true });
    } catch (error) {
      form.setValue("password", "");
      form.setFocus("username");

      if (error instanceof HttpRequestError) {
        setSubmissionNotice(getLoginNotice(error.apiError));
        return;
      }

      setSubmissionNotice({
        title: "Khong the dang nhap",
        message: "He thong Mina tam thoi chua the xu ly yeu cau dang nhap. Hay thu lai.",
        variant: "error",
      });
    }
  }

  const usernameError = form.formState.errors.username?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 md:px-6">
      <div className="w-full max-w-[30rem] space-y-5">
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="rounded-[var(--radius-card)] bg-[var(--primary-subtle)] p-3">
            <School aria-hidden="true" className="size-6 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Mina AI
            </p>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              Đăng nhập vào Mina AI
            </h1>
          </div>
        </div>

        <Card className="shadow-[var(--shadow-sm)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Truy cập hệ thống học tập tại trường</CardTitle>
            <CardDescription>
              Đăng nhập để truy cập Mina AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {auth.notice ? <AuthNoticeAlert notice={auth.notice} /> : null}
            {submissionNotice ? <AuthNoticeAlert notice={submissionNotice} /> : null}

            <form
              noValidate
              className="space-y-4"
              onSubmit={(event) => {
                void form.handleSubmit(handleSubmit)(event);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  invalid={Boolean(usernameError)}
                  aria-describedby={usernameError ? "username-error" : undefined}
                  {...usernameField}
                  ref={(element) => {
                    usernameField.ref(element);
                    usernameInputRef.current = element;
                  }}
                />
                {usernameError ? <InputMessage id="username-error">{usernameError}</InputMessage> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className="pr-12"
                    {...passwordField}
                  />
                  <button
                    type="button"
                    className="motion-standard absolute inset-y-0 right-1 my-1 inline-flex min-h-[var(--size-button-default)] min-w-[var(--size-button-default)] items-center justify-center rounded-[var(--radius-base)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                    aria-label={showPassword ? "An mat khau" : "Hien mat khau"}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
                {passwordError ? <InputMessage id="password-error">{passwordError}</InputMessage> : null}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loginMutation.isPending}
                isLoading={loginMutation.isPending}
                loadingLabel="Dang dang nhap"
              >
                Dang nhap
              </Button>

              <InputDescription>
                Nếu máy chủ AI MINA tại trường không sẵn sàng, vui lòng thu lai hoặc kiểm
                tra Wi-Fi nội bộ.
              </InputDescription>
            </form>
          </CardContent>
        </Card>

        <Alert variant="info">
          <AlertTitle className="flex items-center gap-2">
            <LogIn aria-hidden="true" className="size-4" />
            <span>Ghi chu van hanh</span>
          </AlertTitle>
          <AlertDescription>
            Giao dien nay la auth UI MVP. Backend thuc te sau nay van phai tu xac thuc va kiem tra
            quyen.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
