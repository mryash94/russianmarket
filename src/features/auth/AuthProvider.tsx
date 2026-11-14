import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from '../../lib/supabase'
import { AuthContext, type AuthContextValue, type UserRole } from './authContext'

const AUTHORIZED_ADMIN_EMAIL = 'own77777777@gmail.com'
const PENDING_CHECKOUT_KEY = 'rm_pending_checkout'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Verify server-side role from user_roles table and is_admin() RPC
  const fetchUserRole = useCallback(async (activeUser: User | null): Promise<UserRole> => {
    if (!activeUser) return 'customer'

    if (!supabase) {
      const email = activeUser.email?.trim().toLowerCase() ?? ''
      return email === AUTHORIZED_ADMIN_EMAIL ? 'admin' : 'customer'
    }

    try {
      // 1. Check server-side is_admin RPC
      const { data: serverIsAdmin, error: rpcError } = await supabase.rpc('is_admin')
      if (!rpcError && typeof serverIsAdmin === 'boolean') {
        return serverIsAdmin ? 'admin' : 'customer'
      }

      // 2. Query user_roles table
      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', activeUser.id)
        .maybeSingle()

      if (!roleError && data?.role === 'admin') {
        return 'admin'
      }

      // 3. Fallback check for root administrator
      const email = activeUser.email?.trim().toLowerCase() ?? ''
      return email === AUTHORIZED_ADMIN_EMAIL ? 'admin' : 'customer'
    } catch {
      return 'customer'
    }
  }, [])

  // Sync session and role
  const syncSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession)
    const activeUser = nextSession?.user ?? null
    setUser(activeUser)

    if (activeUser) {
      const resolvedRole = await fetchUserRole(activeUser)
      setRole(resolvedRole)
    } else {
      setRole(null)
    }
    setLoading(false)
  }, [fetchUserRole])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let isMounted = true

    // Check initial active session
    void supabase.auth.getSession().then(async ({ data: { session: initialSession }, error: sessionError }) => {
      if (!isMounted) return
      if (sessionError) {
        console.warn('Supabase session restore warning:', sessionError.message)
      }
      await syncSession(initialSession)
    }).catch((err: unknown) => {
      if (!isMounted) return
      console.error('Failed to restore Supabase session:', err)
      setLoading(false)
    })

    // Listen to real-time auth changes (Sign-in, OAuth redirects, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return
        await syncSession(nextSession)
      },
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [syncSession])

  const signInWithGoogle = useCallback(async (returnUrl?: string) => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      return
    }

    if (returnUrl) {
      sessionStorage.setItem('rm_auth_return_url', returnUrl)
    }

    try {
      const redirectOrigin = window.location.origin
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (oauthError) {
        setError(oauthError.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google OAuth failed to initialize.')
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInError) {
        setError(signInError.message)
        return
      }
      await syncSession(data.session)
      setNotice('Signed in successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    }
  }, [syncSession])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      if (data.session) {
        await syncSession(data.session)
        setNotice('Account created and signed in.')
      } else {
        setNotice('Please check your email to confirm your account, then sign in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.')
    }
  }, [syncSession])

  const sendEmailOtp = useCallback(async (email: string) => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      return
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (otpError) {
        setError(otpError.message)
        throw otpError
      }
      setNotice(`One-time verification code sent to ${email}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code.')
      throw err
    }
  }, [])

  const verifyOtp = useCallback(async (email: string, token: string): Promise<boolean> => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      return false
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'email',
      })
      if (verifyError || !data.session) {
        setError(verifyError?.message ?? 'Invalid or expired verification code.')
        return false
      }
      await syncSession(data.session)
      setNotice('Verification successful.')
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
      return false
    }
  }, [syncSession])

  const signOut = useCallback(async () => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      await syncSession(null)
      return
    }

    try {
      await supabase.auth.signOut()
      await syncSession(null)
      setNotice('Signed out.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed.')
    }
  }, [syncSession])

  const clearMessages = useCallback(() => {
    setError(null)
    setNotice(null)
  }, [])

  const setPendingCheckoutProduct = useCallback((productId: string) => {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, productId)
  }, [])

  const getPendingCheckoutProduct = useCallback(() => {
    return sessionStorage.getItem(PENDING_CHECKOUT_KEY)
  }, [])

  const clearPendingCheckoutProduct = useCallback(() => {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
  }, [])

  const isAuthorizedEmail = Boolean(
    user?.email?.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL
  )
  const isAdmin = Boolean(role === 'admin' || isAuthorizedEmail)

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    role,
    isAdmin,
    isAuthorizedAdmin: isAuthorizedEmail,
    loading,
    error,
    notice,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendEmailOtp,
    verifyOtp,
    signOut,
    clearMessages,
    setPendingCheckoutProduct,
    getPendingCheckoutProduct,
    clearPendingCheckoutProduct,
  }), [
    session,
    user,
    role,
    isAdmin,
    isAuthorizedEmail,
    loading,
    error,
    notice,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendEmailOtp,
    verifyOtp,
    signOut,
    clearMessages,
    setPendingCheckoutProduct,
    getPendingCheckoutProduct,
    clearPendingCheckoutProduct,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
