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

export function AuthPanel({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const {
    user,
    isAdmin,
    loading,
    error,
    notice,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    clearMessages,
  } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    setSubmitting(true)
    try {
      if (mode === 'sign-in') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
      onAuthSuccess?.()
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

  if (user) {
    return (
      <div className="p-6 bg-[#0c0e12] border border-white/10 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-white/10 flex items-center justify-center font-bold text-white text-lg">
            {(user.email?.[0] ?? 'C').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase">
                AUTHENTICATED {isAdmin ? 'ADMINISTRATOR' : 'COLLECTOR'}
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 text-[9px] bg-red-500/20 border border-red-500/40 text-red-400 rounded-full font-mono">
                  ROOT CLEARANCE
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white truncate">{user.email}</h3>
            <p className="text-xs text-white/50">Protected by Supabase Auth</p>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
          onClick={() => void signOut()}
        >
          <Icon name="lock-keyhole" size={14} />
          Sign Out of Vault
        </button>
        {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">{error}</p>}
        {notice && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">{notice}</p>}
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#0c0e12] border border-white/10 rounded-2xl flex flex-col gap-5 shadow-2xl">
      <div className="text-left space-y-1">
        <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
          SECURE VAULT ACCESS
        </span>
        <h2 className="text-lg font-bold text-white">
          {mode === 'sign-in' ? 'Sign In to RUSSIAN MARKET' : 'Create Collector Account'}
        </h2>
        <p className="text-xs text-white/60">
          Instant access to haute digital collectibles and private vault delivery.
        </p>
      </div>

      {!supabase && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
          {supabaseConfigError}
        </p>
      )}

      {/* Google OAuth Button */}
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

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-mono text-white/40 uppercase">Or continue with email</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5">
        <button
          type="button"
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === 'sign-in'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
          onClick={() => {
            clearMessages()
            setMode('sign-in')
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === 'sign-up'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
          onClick={() => {
            clearMessages()
            setMode('sign-up')
          }}
        >
          Register
        </button>
      </div>

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

        <div className="space-y-1">
          <label className="text-xs text-white/70 font-medium">Password</label>
          <input
            type="password"
            required
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            placeholder="••••••••••••"
            minLength={6}
            disabled={!supabase || submitting || googleLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
            {notice}
          </p>
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
              <span>{mode === 'sign-in' ? 'Sign In Securely' : 'Create Collector Account'}</span>
              <Icon name="arrow-right" size={15} />
            </>
          )}
        </button>
      </form>

      <p className="text-[11px] text-white/40 flex items-center justify-center gap-1.5 font-mono">
        <Icon name="shield-check" size={13} className="text-emerald-400" />
        256-Bit SSL Encrypted Vault Authentication
      </p>
    </div>
  )
}
