import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshingRef = useRef(null)

  // Restore session from cookie on mount
  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user ?? null))
      .finally(() => setLoading(false))
  }, [])

  const refresh = useCallback(async () => {
    // Deduplicate concurrent refresh calls
    if (refreshingRef.current) return refreshingRef.current

    refreshingRef.current = fetch('/api/refresh', {
      method: 'POST',
      credentials: 'include',
    }).then(res => {
      if (!res.ok) throw new Error('Refresh failed')
      return res.json()
    }).then(data => {
      setUser(data.user)
      return data.user
    }).finally(() => {
      refreshingRef.current = null
    })

    return refreshingRef.current
  }, [])

  const signUp = useCallback(async (email, password, passwordConfirmation) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { email, password, password_confirmation: passwordConfirmation } }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.errors?.join(', ') ?? 'Sign up failed')

    setUser(data.user)
    return data.user
  }, [])

  const signIn = useCallback(async (email, password) => {
    const res = await fetch('/api/users/sign_in', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { email, password } }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error('Invalid email or password')

    setUser(data.user)
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/users/sign_out', {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {})

    setUser(null)
  }, [])

  const authFetch = useCallback(async (url, options = {}) => {
    const opts = {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }

    const res = await fetch(url, opts)

    if (res.status === 401) {
      try {
        await refresh()
        return fetch(url, opts)
      } catch {
        setUser(null)
        return res
      }
    }

    return res
  }, [refresh])

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, authFetch, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
