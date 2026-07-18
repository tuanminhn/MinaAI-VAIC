const storageKey = "mina-ai.auth-session";

type StoredSession = {
  accessToken: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const authSessionStorage = {
  getAccessToken(): string | null {
    if (!canUseStorage()) {
      return null;
    }

    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<StoredSession>;
      return typeof parsed.accessToken === "string" && parsed.accessToken.length > 0
        ? parsed.accessToken
        : null;
    } catch {
      return null;
    }
  },

  setAccessToken(accessToken: string): void {
    if (!canUseStorage()) {
      return;
    }

    const storedSession: StoredSession = { accessToken };
    window.localStorage.setItem(storageKey, JSON.stringify(storedSession));
  },

  clear(): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.removeItem(storageKey);
  },
};
