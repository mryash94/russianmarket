import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { supabase, supabaseConfigError } from '../../lib/supabase'
import { useAuth } from './authContext'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function AuthPanel({
  onAuthSuccess,
  initialMode = 'sign-up',
}: {
  onAuthSuccess?: () => void
  initialMode?: 'sign-in' | 'sign-up' | 'forgot-password'
}) {
  const {
    user,
    loading,
    error,
    notice,
    isPasswordRecovery,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordResetEmail,
    updateUserPassword,
    resendConfirmationEmail,
    signOut,
    clearMessages,
  } = useAuth()

  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password'>(() => {
    return isPasswordRecovery ? 'sign-in' : initialMode
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    setLocalError(null)

    if (isPasswordRecovery) {
      if (newPassword.length < 8) {
        setLocalError('Password must be at least 8 characters long.')
        return
      }
      if (newPassword !== confirmPassword) {
        setLocalError('Passwords do not match.')
        return
      }
      setSubmitting(true)
      try {
        await updateUserPassword(newPassword)
        onAuthSuccess?.()
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (mode === 'sign-up') {
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters long.')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please re-enter.')
        return
      }
      setSubmitting(true)
      try {
        await signUpWithEmail(email, password)
        onAuthSuccess?.()
      } finally {
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'sign-in') {
        await signInWithEmail(email, password)
        onAuthSuccess?.()
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(email)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    clearMessages()
    setGoogleLoading(true)
    try {
      await signInWithGoogle(window.location.pathname)
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      alert('Please enter your email address to resend confirmation.')
      return
    }
    clearMessages()
    setResending(true)
    try {
      await resendConfirmationEmail(email)
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-[#0c0e12] border border-white/10 rounded-2xl">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-white/60 tracking-wider uppercase font-mono">
          Verifying Sovereign Session…
        </span>
      </div>
    )
  }

  // Active Session View (When already signed in and not resetting password)
  if (user && !isPasswordRecovery) {
    return (
      <div className="p-6 bg-[#0c0e12] border border-white/10 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-white/10 flex items-center justify-center font-bold text-white text-lg">
            {(user.email?.[0] ?? 'C').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase block">
              AUTHENTICATED COLLECTOR
            </span>
            <h3 className="text-sm font-semibold text-white truncate">{user.email}</h3>
            <p className="text-xs text-white/50">Protected by Supabase Auth (Active)</p>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
          onClick={() => void signOut()}
        >
          <Icon name="lock-keyhole" size={14} />
          Sign Out
        </button>
        {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">{error}</p>}
        {notice && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">{notice}</p>}
      </div>
    )
  }

  // Password Recovery Mode (Triggered by recovery token in URL)
  if (isPasswordRecovery) {
    return (
      <div className="p-6 bg-[#0c0e12] border border-white/10 rounded-2xl flex flex-col gap-5 shadow-2xl">
        <div className="text-left space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            SECURITY RECOVERY
          </span>
          <h2 className="text-lg font-bold text-white">
            Set New Secure Password
          </h2>
          <p className="text-xs text-white/60">
            Create a new master password for your collector account.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3.5">
          <div className="space-y-1">
            <label className="text-xs text-white/70 font-medium">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="•••••••••••• (min 8 chars)"
              disabled={submitting}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/70 font-medium">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••••••"
              disabled={submitting}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {(localError || error) && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {localError || error}
            </p>
          )}
          {notice && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 mt-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Save New Password & Sign In</span>
                <Icon name="arrow-right" size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  // Standard Login / Registration / Forgot Password UI
  return (
    <div className="p-6 bg-[#0c0e12] border border-white/10 rounded-2xl flex flex-col gap-5 shadow-2xl">
      <div className="text-left space-y-1">
        <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
          COLLECTOR AUTHENTICATION
        </span>
        <h2 className="text-lg font-bold text-white">
          {mode === 'sign-up' && 'Create Collector Account'}
          {mode === 'sign-in' && 'Sign In to RUSSIAN MARKET'}
          {mode === 'forgot-password' && 'Reset Account Password'}
        </h2>
        <p className="text-xs text-white/60">
          {mode === 'sign-up'
            ? 'Register to acquire exclusive digital collectible cards with verified provenance.'
            : mode === 'forgot-password'
            ? 'Enter your registered email address to receive password recovery instructions.'
            : 'Sign in to access your digital collectible portfolio, orders, and wallet.'}
        </p>
      </div>

      {!supabase && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
          {supabaseConfigError}
        </p>
      )}

      {/* Google OAuth (Available on Sign Up and Sign In) */}
      {mode !== 'forgot-password' && (
        <>
          <button
            type="button"
            disabled={!supabase || googleLoading || submitting}
            onClick={() => void handleGoogleLogin()}
            className="w-full h-11 px-4 rounded-xl bg-white text-black hover:bg-neutral-100 font-semibold text-sm flex items-center justify-center gap-3 transition-transform active:scale-98 shadow-md disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-mono text-white/40 uppercase">Or continue with email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Mode Switcher: Registration Default */}
          <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5">
            <button
              type="button"
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'sign-up'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
              onClick={() => {
                clearMessages()
                setLocalError(null)
                setMode('sign-up')
              }}
            >
              Create Account
            </button>
            <button
              type="button"
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'sign-in'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
              onClick={() => {
                clearMessages()
                setLocalError(null)
                setMode('sign-in')
              }}
            >
              Existing Sign In
            </button>
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <div className="space-y-1">
          <label className="text-xs text-white/70 font-medium">Email Address</label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="collector@domain.com"
            disabled={!supabase || submitting || googleLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {mode !== 'forgot-password' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/70 font-medium">Password</label>
              {mode === 'sign-in' && (
                <button
                  type="button"
                  onClick={() => {
                    clearMessages()
                    setLocalError(null)
                    setMode('forgot-password')
                  }}
                  className="text-[11px] text-cyan-400/80 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              placeholder="•••••••••••• (min 8 chars)"
              minLength={8}
              disabled={!supabase || submitting || googleLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        )}

        {mode === 'sign-up' && (
          <div className="space-y-1">
            <label className="text-xs text-white/70 font-medium">Confirm Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••••••"
              minLength={8}
              disabled={!supabase || submitting || googleLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        )}

        {(localError || error) && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg space-y-1">
            <p>{localError || error}</p>
            {error && error.toLowerCase().includes('not confirmed') && (
              <button
                type="button"
                disabled={resending || !email}
                onClick={() => void handleResendConfirmation()}
                className="text-[11px] text-cyan-400 underline hover:text-cyan-300 mt-1 block"
              >
                {resending ? 'Sending confirmation email…' : 'Click here to resend verification link'}
              </button>
            )}
          </div>
        )}
        {notice && (
          <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg space-y-1">
            <p>{notice}</p>
            {notice.toLowerCase().includes('confirmation') && (
              <button
                type="button"
                disabled={resending || !email}
                onClick={() => void handleResendConfirmation()}
                className="text-[11px] text-cyan-400 underline hover:text-cyan-300 mt-1 block"
              >
                {resending ? 'Sending confirmation email…' : 'Resend confirmation link'}
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!supabase || submitting || googleLoading}
          className="w-full h-11 mt-1 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>
                {mode === 'sign-up' && 'Create Collector Account'}
                {mode === 'sign-in' && 'Sign In Securely'}
                {mode === 'forgot-password' && 'Send Password Recovery Email'}
              </span>
              <Icon name="arrow-right" size={15} />
            </>
          )}
        </button>

        {mode === 'forgot-password' && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                clearMessages()
                setLocalError(null)
                setMode('sign-in')
              }}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              ← Back to Sign In
            </button>

            <button
              type="button"
              disabled={resending || !email}
              onClick={() => void handleResendConfirmation()}
              className="text-xs text-cyan-400/80 hover:text-cyan-300 transition-colors disabled:opacity-40"
            >
              {resending ? 'Sending…' : 'Resend confirmation'}
            </button>
          </div>
        )}
      </form>

      <p className="text-[11px] text-white/40 flex items-center justify-center gap-1.5 font-mono">
        <Icon name="shield-check" size={13} className="text-emerald-400" />
        256-Bit SSL Encrypted Sovereign Authentication
      </p>
    </div>
  )
}
