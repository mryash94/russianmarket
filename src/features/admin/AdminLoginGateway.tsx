import { useState, type FormEvent } from 'react'
import { ShieldAlert, Lock, ArrowRight, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/authContext'

type AdminLoginGatewayProps = {
  onSuccess: () => void
  onReturnToStore: () => void
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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

export function AdminLoginGateway({ onSuccess, onReturnToStore }: AdminLoginGatewayProps) {
  const {
    user,
    isAdmin,
    loading,
    error,
    notice,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    clearMessages,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-white/60 font-mono tracking-widest uppercase">
          Verifying Sovereign Security Clearance…
        </span>
      </div>
    )
  }

  // 2. User logged in but NOT an authorized admin (403 Forbidden)
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#060709] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0c0e12] border border-red-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase">
              SECURITY CLEARANCE DENIED [403]
            </span>
            <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
            <p className="text-xs text-white/60">
              The currently active session does not possess administrator clearance in the server role registry.
            </p>
          </div>

          <div className="p-3.5 bg-red-500/5 border border-red-500/15 rounded-xl text-left text-xs text-white/70 space-y-1">
            <p className="font-semibold text-red-400">Administrative Policy:</p>
            <p className="text-white/60 text-[11px] leading-relaxed">
              Access to this console requires server-verified role assignment. If you hold administrative credentials, sign out and authenticate with your designated account.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Switch Account
            </button>
            <button
              type="button"
              onClick={onReturnToStore}
              className="w-full py-2.5 px-4 rounded-xl text-white/50 hover:text-white text-xs font-medium transition-colors"
            >
              Return to Customer Website
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. User logged in AND is verified admin -> trigger success
  if (user && isAdmin) {
    onSuccess()
    return null
  }

  // 4. Guest / Unauthenticated: Show Sovereign Admin Gateway
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearMessages()
    setSubmitting(true)

    try {
      await signInWithEmail(email, password)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleAdminLogin = async () => {
    clearMessages()
    setGoogleLoading(true)
    try {
      await signInWithGoogle('/admin')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060709] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c0e12] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                CONTROL ROOM
              </span>
              <h2 className="text-base font-bold tracking-tight">Administrator Gateway</h2>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full">
            LEVEL-4
          </span>
        </div>

        <p className="text-xs text-white/60">
          This portal is restricted to authorized operators. Identity and access rights are authoritatively verified by the server.
        </p>

        {/* 1-Click Google OAuth for Admin */}
        <button
          type="button"
          disabled={googleLoading || submitting}
          onClick={() => void handleGoogleAdminLogin()}
          className="w-full h-11 px-4 rounded-xl bg-white text-black hover:bg-neutral-100 font-semibold text-xs flex items-center justify-center gap-2.5 transition-transform active:scale-98 shadow-md disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>Sign In with Google</span>
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-mono text-white/40 uppercase">Or operator credentials</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-white/70 font-medium">Administrator Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="operator@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/70 font-medium">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl font-mono">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl font-mono">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate Operator</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onReturnToStore}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            ← Return to Storefront
          </button>
          <span className="text-[11px] text-emerald-400/80 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            TLS 1.3 Verified
          </span>
        </div>
      </div>
    </div>
  )
}
