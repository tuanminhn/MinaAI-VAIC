import { createContext } from "react";
import type { AuthContextValue } from "@/features/auth/types/auth-context";

export const AuthContext = createContext<AuthContextValue | null>(null);
