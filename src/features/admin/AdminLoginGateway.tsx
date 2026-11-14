import { useState, type FormEvent } from 'react'
import { ShieldAlert, Lock, ArrowRight, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/authContext'

const AUTHORIZED_ADMIN_EMAIL = 'own77777777@gmail.com'

type AdminLoginGatewayProps = {
  onSuccess: () => void
  onReturnToStore: () => void
}

export function AdminLoginGateway({ onSuccess, onReturnToStore }: AdminLoginGatewayProps) {
  const {
    user,
    isAdmin,
    loading,
    error,
    notice,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    clearMessages,
  } = useAuth()

  const [email, setEmail] = useState(AUTHORIZED_ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'initialize'>('sign-in')
  const [submitting, setSubmitting] = useState(false)

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
              You are signed in as <span className="text-white font-mono font-medium">{user.email}</span>, which does not hold administrator authorization.
            </p>
          </div>

          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-left text-[11px] text-white/70 space-y-1">
            <p className="font-semibold text-red-400">Required Authorization:</p>
            <p className="font-mono text-white/90">Email: {AUTHORIZED_ADMIN_EMAIL}</p>
            <p className="text-white/50">Only authorized cryptographic operators may access the Control Room.</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Switch to Admin Account
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
      if (mode === 'sign-in') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
    } finally {
      setSubmitting(false)
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
              <h2 className="text-base font-bold tracking-tight">Sovereign Admin Gateway</h2>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full">
            LEVEL-4
          </span>
        </div>

        <p className="text-xs text-white/60">
          This gateway is restricted to authorized operators. Authentication identity is verified against the server role registry.
        </p>

        {/* Tab mode: Sign In vs Initialize */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-semibold">
          <button
            type="button"
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'sign-in' ? 'bg-white/15 text-white shadow' : 'text-white/40 hover:text-white'
            }`}
            onClick={() => {
              clearMessages()
              setMode('sign-in')
            }}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'initialize' ? 'bg-white/15 text-white shadow' : 'text-white/40 hover:text-white'
            }`}
            onClick={() => {
              clearMessages()
              setMode('initialize')
            }}
          >
            Create Admin Account
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-white/70 font-medium">Administrator Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL && (
              <p className="text-[11px] text-amber-400/80 pt-0.5">
                Note: Initial root admin is {AUTHORIZED_ADMIN_EMAIL}.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/70 font-medium">
              {mode === 'sign-in' ? 'Master Password' : 'Set New Secure Password'}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              minLength={8}
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
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'sign-in' ? 'Authenticate & Enter' : 'Initialize Root Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google sign-in for admin */}
        <div className="pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => void signInWithGoogle(window.location.pathname)}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white flex items-center justify-center gap-2 transition-colors"
          >
            <span>Sign in with Google ({AUTHORIZED_ADMIN_EMAIL})</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onReturnToStore}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            ← Return to Customer Website
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
