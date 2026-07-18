import { useMutation } from "@tanstack/react-query";
import type { AuthSession, LoginRequest } from "@/contracts/auth";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function useLoginMutation() {
  const auth = useAuth();

  return useMutation<AuthSession, Error, LoginRequest>({
    mutationFn: (input: LoginRequest) => auth.signIn(input),
    onMutate: () => {
      auth.clearNotice();
    },
  });
}

export function useLogoutMutation() {
  const auth = useAuth();

  return useMutation<void, Error, void>({
    mutationFn: () => auth.signOut(),
  });
}
