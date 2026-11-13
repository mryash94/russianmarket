import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from '../../lib/supabase'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    let active = true
    let receivedAuthEvent = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        receivedAuthEvent = true
        if (active) {
          setSession(nextSession)
          setLoading(false)
        }
      },
    )

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || receivedAuthEvent) return
      setSession(data.session)
      setError(sessionError ? 'Your saved session could not be restored.' : null)
      setLoading(false)
    }).catch((sessionError: unknown) => {
      if (!active || receivedAuthEvent) return
      console.error('BLACK X could not restore the Supabase session.', sessionError)
      setError('Your saved session could not be restored. Please try signing in again.')
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const runAuthAction = useCallback(async (
    action: 'signIn' | 'signUp' | 'signOut',
    email?: string,
    password?: string,
  ) => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError(supabaseConfigError ?? 'Supabase authentication is unavailable.')
      return
    }

    try {
      if (action === 'signOut') {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) {
          setError(signOutError.message)
          return
        }
        setSession(null)
        setNotice('You have been signed out.')
        return
      }

      const credentials = {
        email: email?.trim().toLowerCase() ?? '',
        password: password ?? '',
      }
      if (action === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword(credentials)
        if (signInError) {
          setError(signInError.message)
          return
        }
        setNotice('You are signed in.')
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp(credentials)
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      setNotice(data.session
        ? 'Your account is ready.'
        : 'Check your email to confirm your account, then sign in.')
    } catch (authError) {
      console.error(`BLACK X Supabase ${action} request failed.`, authError)
      setError(authError instanceof Error
        ? authError.message
        : 'The authentication request could not be completed. Please try again.')
    }
  }, [])

  const signIn = useCallback(
    (email: string, password: string) => runAuthAction('signIn', email, password),
    [runAuthAction],
  )
  const signUp = useCallback(
    (email: string, password: string) => runAuthAction('signUp', email, password),
    [runAuthAction],
  )
  const signOut = useCallback(
    () => runAuthAction('signOut'),
    [runAuthAction],
  )
  const clearMessages = useCallback(() => {
    setError(null)
    setNotice(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    error,
    notice,
    signIn,
    signUp,
    signOut,
    clearMessages,
  }), [session, loading, error, notice, signIn, signUp, signOut, clearMessages])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
