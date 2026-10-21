import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchSession } from "../api/authAPI";
import { getToken, setUnauthorizedHandler, TOKEN_KEY, USER_KEY } from "../api/http";

/**
 * Who is signed in.
 *
 * Two decisions worth explaining, because the previous version of this project got both
 * wrong:
 *
 * 1. **The stored user is never trusted for authorisation.** It is a cache for rendering
 *    (so the navbar can show a name before the network responds). Every protected action is
 *    authorised by the server from the bearer token. Hiding a button is cosmetic; the
 *    server is what actually refuses.
 *
 * 2. **The session is re-checked against the server on load.** A token in localStorage can
 *    outlive the account's permissions - a seller whose application was just rejected still
 *    holds a "seller" token. `fetchSession` is what corrects the UI, and the HTTP layer
 *    clears the whole session when the server answers 401.
 */
const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Guard against a hand-edited or corrupted entry turning into a React crash.
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return parsed;
  } catch {
    // Malformed JSON: clear it rather than crashing on every render.
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [canSell, setCanSell] = useState(false);
  const [checking, setChecking] = useState(Boolean(getToken()));

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
    setUser(null);
    setCanSell(false);
  }, []);

  // The HTTP layer calls this when the server rejects the token.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setCanSell(false);
    });
  }, []);

  // Re-check the stored session once on load. `checking` starts true only when there is a
  // token to verify, so the first render already has the right answer and nothing has to be
  // set synchronously inside the effect.
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const session = await fetchSession();
        if (cancelled) return;
        setUser(session.user);
        setCanSell(Boolean(session.canSell));
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        } catch {
          /* storage unavailable */
        }
      } catch (error) {
        if (cancelled) return;
        // A 401/403 means the token is genuinely no longer good. A network error just
        // means the server is unreachable - keep the cached user so the UI still renders,
        // without claiming the session was verified.
        if (error.status === 401 || error.status === 403) {
          clearSession();
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  /** Store a successful login/signup response. */
  const login = useCallback((payload) => {
    if (!payload?.token || !payload?.user) {
      throw new Error("The server returned an invalid login response.");
    }
    try {
      localStorage.setItem(TOKEN_KEY, payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    } catch {
      throw new Error("Your browser is blocking local storage, so you can't stay signed in.");
    }
    setUser(payload.user);
    setCanSell(payload.user.role === "admin" || payload.user.sellerStatus === "approved");
  }, []);

  /**
   * Refresh the stored user after something changed it server-side - for example an admin
   * approving an application.
   */
  const refresh = useCallback(async () => {
    if (!getToken()) return null;
    const session = await fetchSession();
    setUser(session.user);
    setCanSell(Boolean(session.canSell));
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } catch {
      /* storage unavailable */
    }
    return session.user;
  }, []);

  const value = {
    user,
    canSell,
    checking,
    isAdmin: user?.role === "admin",
    isSeller: user?.role === "seller",
    isBuyer: user?.role === "buyer",
    login,
    logout: clearSession,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
