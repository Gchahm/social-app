import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as React from 'react';

export type AuthContext = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
};

const STORAGE_KEY = 'app:auth';

const DEFAULT_SETTINGS = { accessToken: '', refreshToken: '' };

function safeParse(json: string | null): AuthContext | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.refreshToken === 'string'
    ) {
      return parsed;
    }
  } catch (_) {
    // ignore
  }
  return null;
}

export type AuthContextValue = AuthContext & {
  setAuthContext: (auth: AuthContext) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export type AppSettingsProviderProps = {
  onTokenExpired: (refreshToken: string) => AuthContext;
  loadingComponent: ReactNode;
};

export function AuthContextProvider({
  onTokenExpired,
  loadingComponent,
  children,
}: PropsWithChildren<AppSettingsProviderProps>) {
  const [authContext, setAuthContextState] = useState<AuthContext>(() => {
    const fromStorage = safeParse(window.localStorage.getItem(STORAGE_KEY));
    return fromStorage ?? DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState(true);

  const tokenExpiryDate = useMemo(() => {
    if (!authContext.accessToken) return 0;
    const payload = JSON.parse(atob(authContext.accessToken.split('.')[1]));
    return payload.exp * 1000;
  }, [authContext]);

  useEffect(() => {
    if (!tokenExpiryDate || !authContext) return;
    const { refreshToken } = authContext;

    const expiryDuration = tokenExpiryDate - Date.now() - 2 * 60 * 1000;

    if (expiryDuration > 0) {
      setIsLoading(false);
    }

    const timeout = setTimeout(() => {
      onTokenExpired(refreshToken);
    }, Math.max(expiryDuration, 0));

    return () => {
      clearInterval(timeout);
    };
  }, [authContext]);

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authContext));
    } catch {
      // ignore storage errors
    }
  }, [authContext]);

  const setAuthContext = useCallback((partial: Partial<AuthContext>) => {
    setAuthContextState((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...authContext, setAuthContext }),
    [authContext, setAuthContext]
  );

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? loadingComponent : children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthContextProvider');
  }
  return ctx;
}
