import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuthSession, LoginRequest } from "@/contracts/auth";
import { AppLoading } from "@/components/feedback/app-loading";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { AuthContext } from "@/features/auth/hooks/auth-context";
import { authSessionStorage } from "@/features/auth/hooks/auth-session-storage";
import type { AuthNotice } from "@/features/auth/types/auth-notice";
import type { AuthContextValue, AuthStatus } from "@/features/auth/types/auth-context";
import { isApiError } from "@/lib/api/api-error";
import { HttpRequestError } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/query/query-keys";
import { httpAuthRepository } from "@/repositories/http-auth-repository";

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    authSessionStorage.getAccessToken(),
  );
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const restoreQuery = useQuery({
    queryKey: queryKeys.auth.me(accessToken),
    queryFn: ({ signal }) => httpAuthRepository.getCurrentUser(accessToken as string, signal),
    enabled: Boolean(accessToken) && !session,
    retry: 0,
  });

  useEffect(() => {
    if (!restoreQuery.error || !accessToken) {
      return;
    }

    const apiError =
      restoreQuery.error instanceof HttpRequestError
        ? restoreQuery.error.apiError
        : isApiError(restoreQuery.error)
          ? restoreQuery.error
          : null;

    authSessionStorage.clear();
    setAccessToken(null);
    setSession(null);
    setNotice(
      apiError
        ? getSessionRestoreNotice(apiError)
        : {
            title: "Khong the khoi phuc phien lam viec",
            message: "Mina AI can dang nhap lai de tiep tuc.",
            variant: "warning",
          },
    );
  }, [accessToken, restoreQuery.error]);

  const activeSession = useMemo(
    () =>
      session ??
      (accessToken && restoreQuery.data
        ? {
            user: restoreQuery.data,
            accessToken,
          }
        : null),
    [accessToken, restoreQuery.data, session],
  );

  const status: AuthStatus =
    accessToken && !activeSession && (restoreQuery.isPending || restoreQuery.isFetching)
      ? "restoring"
      : activeSession
        ? "authenticated"
        : "unauthenticated";

  const signIn = useCallback(async (input: LoginRequest): Promise<AuthSession> => {
    const nextSession = await httpAuthRepository.login(input);
    authSessionStorage.setAccessToken(nextSession.accessToken);
    setAccessToken(nextSession.accessToken);
    setSession(nextSession);
    setNotice(null);
    return nextSession;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const currentAccessToken = activeSession?.accessToken ?? accessToken;

    try {
      if (currentAccessToken) {
        await httpAuthRepository.logout(currentAccessToken);
      }
    } finally {
      authSessionStorage.clear();
      setAccessToken(null);
      setSession(null);
      setNotice(null);
    }
  }, [accessToken, activeSession?.accessToken]);

  const resetSession = useCallback((nextNotice?: AuthNotice): void => {
    authSessionStorage.clear();
    setAccessToken(null);
    setSession(null);
    setNotice(nextNotice ?? null);
  }, []);

  const clearNotice = useCallback((): void => {
    setNotice(null);
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      status,
      session: activeSession,
      user: activeSession?.user ?? null,
      notice,
      signIn,
      signOut,
      resetSession,
      clearNotice,
    }),
    [activeSession, clearNotice, notice, resetSession, signIn, signOut, status],
  );

  if (status === "restoring") {
    return <AppLoading message="Dang khoi phuc phien dang nhap Mina AI" />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
