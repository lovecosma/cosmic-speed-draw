import { useState, useCallback, useEffect, useRef } from "react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshingRef = useRef(null);

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

      const refreshRes = await fetch("/api/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setUser(data.user);
        return;
      }

      const provisionalRes = await fetch("/api/provisional_sessions", {
        method: "POST",
        credentials: "include",
      });
      const data = await provisionalRes.json();
      setUser(data.user);
    }

    bootstrap().finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return refreshingRef.current;

    refreshingRef.current = fetch("/api/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Refresh failed");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        return data.user;
      })
      .finally(() => {
        refreshingRef.current = null;
      });

    return refreshingRef.current;
  }, []);

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

    // After signing out, start a fresh provisional session so the user
    // can keep using the app without being forced to log back in.
    const provisionalRes = await fetch("/api/provisional_sessions", {
      method: "POST",
      credentials: "include",
    });
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

      if (res.status === 401) {
        try {
          await refresh();
          return fetch(url, opts);
        } catch {
          setUser(null);
          return res;
        }
      }

      return res;
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
