import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { supabase, supabaseConfigError } from '../../lib/supabase'
import { useAuth } from './authContext'

export function AuthPanel() {
  const { user, loading, error, notice, signIn, signUp, signOut, clearMessages } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    setSubmitting(true)
    try {
      if (mode === 'sign-in') await signIn(email, password)
      else await signUp(email, password)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="account-state" role="status">
        <span className="account-spinner" aria-hidden="true" />
        <span>Restoring your secure session…</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="account-authenticated">
        <div className="account-authenticated-copy">
          <span className="settings-avatar" aria-hidden="true">
            {(user.email?.[0] ?? 'B').toUpperCase()}
          </span>
          <div>
            <span className="section-kicker">SIGNED IN</span>
            <h2>{user.email}</h2>
            <p>Your account session is protected by Supabase Auth.</p>
          </div>
        </div>
        <button
          type="button"
          className="auth-submit auth-submit--secondary"
          onClick={() => void signOut()}
        >
          <Icon name="lock-keyhole" size={15} />
          Sign out
        </button>
        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        {notice && <p className="auth-message" role="status">{notice}</p>}
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="auth-card-heading">
        <span className="section-kicker">SECURE CUSTOMER ACCOUNT</span>
        <h2>{mode === 'sign-in' ? 'Welcome back.' : 'Create your account.'}</h2>
        <p>Authentication is handled securely by Supabase. BLACK X never stores your password.</p>
      </div>
      {!supabase && (
        <p className="auth-config-warning" role="status">
          {supabaseConfigError} Authentication forms are unavailable until this is configured.
        </p>
      )}
      <div className="auth-mode-toggle" role="group" aria-label="Account action">
        <button
          type="button"
          aria-pressed={mode === 'sign-in'}
          onClick={() => {
            clearMessages()
            setMode('sign-in')
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === 'sign-up'}
          onClick={() => {
            clearMessages()
            setMode('sign-up')
          }}
        >
          Create account
        </button>
      </div>
      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={!supabase || submitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            maxLength={128}
            disabled={!supabase || submitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        {notice && <p className="auth-message" role="status">{notice}</p>}
        <button type="submit" className="auth-submit" disabled={!supabase || submitting}>
          {submitting && <span className="account-spinner" aria-hidden="true" />}
          {submitting
            ? 'Please wait…'
            : mode === 'sign-in'
              ? 'Sign in securely'
              : 'Create account'}
          {!submitting && <Icon name="arrow-right" size={16} />}
        </button>
      </form>
      <p className="auth-security-note">
        <Icon name="shield-check" size={15} />
        Sessions persist through Supabase Auth. Sign out on shared devices.
      </p>
    </div>
  )
}
