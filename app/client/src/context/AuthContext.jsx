import { useState, useCallback, useEffect, useRef } from "react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshPromiseRef = useRef(null);

  // Deduplicated refresh: concurrent callers share one in-flight request.
  const refresh = useCallback(() => {
    refreshPromiseRef.current ??= fetch("/api/refresh", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  }, []);

  // Bootstrap: restore real session → refresh → provisional session.
  // Always resolves to a user so the app never lands in an unauthenticated state.
  useEffect(() => {
    async function bootstrap() {
      const userRes = await fetch("/api/user", { credentials: "include" });
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.user);
        return;
      }
      // Only attempt refresh/provisional on auth failures. A 5xx or network
      // blip should not silently replace a real session with a guest one.
      if (userRes.status !== 401) return;

      const refreshRes = await refresh();
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setUser(data.user);
        return;
      }
      if (refreshRes.status !== 401) return;

      const provisionalRes = await fetch("/api/provisional_sessions", {
        method: "POST",
        credentials: "include",
      });
      if (!provisionalRes.ok)
        throw new Error("Failed to create provisional session");
      const data = await provisionalRes.json();
      setUser(data.user);
    }

    bootstrap().finally(() => setLoading(false));
  }, [refresh]);

  const signUp = useCallback(async (email, password, passwordConfirmation) => {
    const res = await fetch("/api/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: { email, password, password_confirmation: passwordConfirmation },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.join(", ") ?? "Sign up failed");

    setUser(data.user);
    return data.user;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const res = await fetch("/api/users/sign_in", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { email, password } }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error("Invalid email or password");

    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/users/sign_out", {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});

    const provisionalRes = await fetch("/api/provisional_sessions", {
      method: "POST",
      credentials: "include",
    });
    if (!provisionalRes.ok)
      throw new Error("Failed to create provisional session");
    const data = await provisionalRes.json();
    setUser(data.user);
  }, []);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const opts = {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
      };

      const res = await fetch(url, opts);
      if (res.status !== 401) return res;

      const refreshRes = await refresh();
      if (!refreshRes.ok) return res;

      const data = await refreshRes.json();
      setUser(data.user);
      return fetch(url, opts);
    },
    [refresh],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        authFetch,
        isAuthenticated: !!user && !user.provisional,
        isProvisional: !!user?.provisional,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
