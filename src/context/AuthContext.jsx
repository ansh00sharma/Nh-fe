import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTH_SESSION_CLEARED_EVENT,
  clearAuthSession,
  fetchCurrentUser,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveAuthSession,
} from "../api/auth.js";

const AuthContext = createContext(null);

let currentUserRequest = null;
let currentUserRequestToken = null;

function fetchCurrentUserOnce(accessToken) {
  if (!currentUserRequest || currentUserRequestToken !== accessToken) {
    currentUserRequestToken = accessToken;
    currentUserRequest = fetchCurrentUser(accessToken).finally(() => {
      currentUserRequest = null;
      currentUserRequestToken = null;
    });
  }

  return currentUserRequest;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(() =>
    getAccessToken() ? getStoredUser() : null,
  );
  const [hasAccessToken, setHasAccessToken] = useState(() => Boolean(getAccessToken()));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const mountedRef = useRef(false);
  const initStartedRef = useRef(false);

  const clearLocalAuthState = useCallback(() => {
    setCurrentUserState(null);
    setHasAccessToken(false);
    setIsAuthLoading(false);
  }, []);

  const setCurrentUser = useCallback((user) => {
    if (!user) {
      clearAuthSession();
      clearLocalAuthState();
      return;
    }

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken) {
      saveAuthSession({ accessToken, refreshToken, user });
    }

    setCurrentUserState(user);
    setHasAccessToken(Boolean(accessToken));
    setIsAuthLoading(false);
  }, [clearLocalAuthState]);

  const completeLogin = useCallback(({ accessToken, refreshToken, user }) => {
    saveAuthSession({ accessToken, refreshToken, user });
    setCurrentUserState(user);
    setHasAccessToken(Boolean(accessToken));
    setIsAuthLoading(false);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      clearLocalAuthState();
      return null;
    }

    setHasAccessToken(true);

    try {
      const user = await fetchCurrentUserOnce(accessToken);

      if (mountedRef.current) {
        saveAuthSession({ accessToken, refreshToken: getRefreshToken(), user });
        setCurrentUserState(user);
        setHasAccessToken(true);
      }

      return user;
    } catch {
      clearAuthSession();

      if (mountedRef.current) {
        clearLocalAuthState();
      }

      return null;
    }
  }, [clearLocalAuthState]);

  const logout = useCallback((navigate) => {
    clearAuthSession();
    clearLocalAuthState();

    if (navigate) {
      navigate("/login", { replace: true });
    }
  }, [clearLocalAuthState]);

  useEffect(() => {
    function handleSessionCleared() {
      clearLocalAuthState();
    }

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);

    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    };
  }, [clearLocalAuthState]);

  useEffect(() => {
    mountedRef.current = true;

    if (!initStartedRef.current) {
      initStartedRef.current = true;

      if (!getAccessToken()) {
        clearLocalAuthState();
      } else {
        setIsAuthLoading(true);
        refreshCurrentUser().finally(() => {
          if (mountedRef.current) {
            setIsAuthLoading(false);
          }
        });
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [clearLocalAuthState, refreshCurrentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(hasAccessToken && currentUser),
      isAuthLoading,
      setCurrentUser,
      refreshCurrentUser,
      logout,
      completeLogin,
    }),
    [
      completeLogin,
      currentUser,
      hasAccessToken,
      isAuthLoading,
      logout,
      refreshCurrentUser,
      setCurrentUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
