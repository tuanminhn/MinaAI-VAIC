import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthSession, LoginRequest } from "@/contracts/auth";
import { AppLoading } from "@/components/feedback/app-loading";
import { getSessionRestoreNotice } from "@/features/auth/hooks/auth-error-messages";
import { AuthContext } from "@/features/auth/hooks/auth-context";
import type { AuthNotice } from "@/features/auth/types/auth-notice";
import type { AuthContextValue, AuthStatus } from "@/features/auth/types/auth-context";
import { isApiError } from "@/lib/api/api-error";
import { HttpRequestError } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/query/query-keys";
import { httpAuthRepository } from "@/repositories/http-auth-repository";

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [restoredSession, setRestoredSession] = useState<AuthSession | null>(null);
  const [hasResolvedRestore, setHasResolvedRestore] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const restoreQuery = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: ({ signal }) => httpAuthRepository.getCurrentUser(signal),
    retry: 0,
  });

  useEffect(() => {
    if (!restoreQuery.data) {
      return;
    }

    setRestoredSession({ user: restoreQuery.data });
    setHasResolvedRestore(true);
  }, [restoreQuery.data]);

  useEffect(() => {
    if (!restoreQuery.error) {
      return;
    }

    const apiError =
      restoreQuery.error instanceof HttpRequestError
        ? restoreQuery.error.apiError
        : isApiError(restoreQuery.error)
          ? restoreQuery.error
          : null;

    setSession(null);
    setRestoredSession(null);
    setHasResolvedRestore(true);

    if (apiError?.code === "AUTH_REQUIRED") {
      setNotice(null);
      return;
    }

    setNotice(
      apiError
        ? getSessionRestoreNotice(apiError)
        : {
            title: "Khong the khoi phuc phien lam viec",
            message: "Mina AI can dang nhap lai de tiep tuc.",
            variant: "warning",
          },
    );
  }, [restoreQuery.error]);

  const activeSession = useMemo(
    () => session ?? restoredSession,
    [restoredSession, session],
  );

  const status: AuthStatus = !hasResolvedRestore || restoreQuery.isPending
    ? "restoring"
    : activeSession
      ? "authenticated"
      : "unauthenticated";

  const signIn = useCallback(
    async (input: LoginRequest): Promise<AuthSession> => {
      const nextSession = await httpAuthRepository.login(input);
      setSession(nextSession);
      setRestoredSession(nextSession);
      setHasResolvedRestore(true);
      queryClient.setQueryData(queryKeys.auth.me(), nextSession.user);
      setNotice(null);
      return nextSession;
    },
    [queryClient],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await httpAuthRepository.logout();
    } finally {
      setSession(null);
      setRestoredSession(null);
      setHasResolvedRestore(true);
      setNotice(null);
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
    }
  }, [queryClient]);

  const resetSession = useCallback(
    (nextNotice?: AuthNotice): void => {
      setSession(null);
      setRestoredSession(null);
      setHasResolvedRestore(true);
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
      setNotice(nextNotice ?? null);
    },
    [queryClient],
  );

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
