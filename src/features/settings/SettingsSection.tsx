import { useState } from 'react'
import {
  User,
  Bell,
  LogOut,
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Lock,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { AuthPanel } from '../auth/AuthPanel'

type SettingsSectionProps = {
  isAdmin: boolean
  onToggleAdmin: () => void
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

export function SettingsSection({ isAdmin, onToggleAdmin }: SettingsSectionProps) {
  const { user, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(() => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || 'Valued Collector'
  })
  const [vaultAlerts, setVaultAlerts] = useState(true)
  const [transactionAlerts, setTransactionAlerts] = useState(true)
  const [activeModalPolicy, setActiveModalPolicy] = useState<'privacy' | 'refund' | 'custody' | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const isGoogleUser = user?.app_metadata?.provider === 'google' || user?.identities?.some((i) => i.provider === 'google')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Page Header */}
      <div>
        <h2 className="font-space text-xl md:text-2xl font-semibold text-[#ededed] tracking-tight">
          Account & Settings
        </h2>
        <p className="text-xs text-[#9499a6] font-sans mt-0.5">
          Manage your collector profile, authentication, security, and policies
        </p>
      </div>

      {/* Guest Authentication Prompt (If Not Signed In) */}
      {!user ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-6 bg-[#0c0e13] border border-white/[0.08] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-space font-semibold text-base text-white">Sign In to RUSSIAN MARKET</h3>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              Authenticate via Google or email to link your private Digital Vault, access order history, and manage notifications.
            </p>
          </div>
          <AuthPanel />
        </div>
      ) : (
        <>
          {/* 1. Verified Profile Overview Card */}
          <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={displayName}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#181c25] border border-white/[0.1] flex items-center justify-center font-space text-lg font-bold text-white">
                  {(user.email?.[0] ?? displayName[0] ?? 'C').toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-space font-semibold text-base text-white">{displayName}</h3>
                  <span className={`px-2.5 py-0.5 rounded font-mono-code text-[10px] uppercase border ${
                    isAdmin
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {isAdmin ? 'Administrator' : 'Verified Collector'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-code text-[#9499a6]">
                  {isGoogleUser && <GoogleIcon />}
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-400 hover:text-red-300 transition-colors self-start sm:self-auto active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* 2. Connected Google Account Card */}
          <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Identity & Authentication</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active Session
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#12151c] border border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <GoogleIcon />
                </div>
                <div>
                  <span className="font-space text-xs font-medium text-white block">
                    {isGoogleUser ? 'Google OAuth 2.0 Account' : 'Supabase Auth Credentials'}
                  </span>
                  <span className="text-[11px] text-[#9499a6] font-mono">
                    {user.email}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                {isGoogleUser ? 'Single Sign-On Enabled' : 'Password Protected'}
              </span>
            </div>
          </div>

          {/* 3. Profile Edit Form */}
          <form onSubmit={handleSaveProfile} className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
                <User className="w-4 h-4 text-white/50" />
                <span>Collector Profile Details</span>
              </h3>
              {savedSuccess && (
                <span className="text-xs font-mono-code text-[#34d399] flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Preferences Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-sans text-[#9499a6] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 bg-[#181c25] border border-white/[0.08] focus:border-cyan-400 px-3.5 rounded-xl text-xs text-[#ededed] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans text-[#9499a6] mb-1.5">
                  Email Address (Primary Identity)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full h-11 bg-[#181c25]/60 border border-white/[0.05] px-3.5 rounded-xl text-xs text-[#666b7a] font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold active:scale-98 transition-all"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </>
      )}

      {/* 4. Notification Preferences */}
      <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3.5">
        <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
          <Bell className="w-4 h-4 text-white/50" />
          <span>Notification Preferences</span>
        </h3>

        <div className="divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between py-3">
            <div className="pr-4">
              <span className="font-space font-medium text-xs text-[#ededed] block">
                Digital Vault Delivery Alerts
              </span>
              <span className="text-[11px] text-[#9499a6] font-sans">
                Immediate notification upon verification and release of cryptographic collectibles.
              </span>
            </div>
            <input
              type="checkbox"
              checked={vaultAlerts}
              onChange={(e) => setVaultAlerts(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer flex-shrink-0"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="pr-4">
              <span className="font-space font-medium text-xs text-[#ededed] block">
                Deposit & Transaction Confirmations
              </span>
              <span className="text-[11px] text-[#9499a6] font-sans">
                Real-time updates regarding UPI deposit verification and wallet credits.
              </span>
            </div>
            <input
              type="checkbox"
              checked={transactionAlerts}
              onChange={(e) => setTransactionAlerts(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer flex-shrink-0"
            />
          </div>
        </div>
      </div>

      {/* 5. Store Policies & Custody Documentation */}
      <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3.5">
        <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/50" />
          <span>Store Policies & Cryptographic Terms</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveModalPolicy('privacy')}
            className="p-3.5 rounded-xl bg-[#12151c] hover:bg-[#181c25] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
          >
            <div>
              <span className="font-space font-medium text-xs text-[#ededed] block">
                Privacy Policy
              </span>
              <span className="text-[10px] text-[#9499a6] font-sans">
                Zero-knowledge data custody
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModalPolicy('refund')}
            className="p-3.5 rounded-xl bg-[#12151c] hover:bg-[#181c25] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
          >
            <div>
              <span className="font-space font-medium text-xs text-[#ededed] block">
                Delivery & Refund Policy
              </span>
              <span className="text-[10px] text-[#9499a6] font-sans">
                Digital transfer guarantees
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModalPolicy('custody')}
            className="p-3.5 rounded-xl bg-[#12151c] hover:bg-[#181c25] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
          >
            <div>
              <span className="font-space font-medium text-xs text-[#ededed] block">
                Security Architecture
              </span>
              <span className="text-[10px] text-[#9499a6] font-sans">
                Encryption & vault audit
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 6. STRICTLY CONDITIONAL: Admin Panel Access (Rendered ONLY if user is verified admin) */}
      {isAdmin && (
        <div className="p-4 rounded-xl bg-[#0c0e13] border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs font-mono-code text-amber-300">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Administrator Control Center</span>
          </div>
          <button
            type="button"
            onClick={onToggleAdmin}
            className="px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors"
          >
            Open Control Center
          </button>
        </div>
      )}

      {/* Policy Viewer Dialog */}
      {activeModalPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#0c0e13] rounded-2xl p-6 border border-white/[0.1] shadow-2xl">
            <h3 className="font-space text-lg font-semibold text-[#ededed] mb-3">
              {activeModalPolicy === 'privacy' && 'Privacy Policy'}
              {activeModalPolicy === 'refund' && 'Refund & Digital Delivery Policy'}
              {activeModalPolicy === 'custody' && 'Zero-Knowledge Security Architecture'}
            </h3>
            <div className="text-xs text-[#9499a6] font-sans leading-relaxed whitespace-pre-wrap mb-5 space-y-2">
              {activeModalPolicy === 'privacy' && (
                <>
                  <p>1. Russian Market practices strict data minimization. We never collect, process, or store payment card numbers, expiry dates, or CVV security codes.</p>
                  <p>2. Collector accounts are authenticated via Google OAuth or encrypted Supabase Auth sessions.</p>
                  <p>3. Collector identifiers are used exclusively for digital asset vault settlement and encrypted download entitlement verification.</p>
                </>
              )}
              {activeModalPolicy === 'refund' && (
                <>
                  <p>1. All digital collectible passes and artwork files are cryptographically dispatched to the customer's private Digital Vault immediately upon verified payment settlement.</p>
                  <p>2. Due to the cryptographic nature of instantaneous digital delivery, completed orders cannot be reversed once the digital pass is minted.</p>
                  <p>3. In the unlikely event of network interruption or delivery error, our Concierge service provides instant re-issuance.</p>
                </>
              )}
              {activeModalPolicy === 'custody' && (
                <>
                  <p>1. High-resolution master assets are stored in isolated encrypted storage buckets accessible solely via time-limited signed URL tokens.</p>
                  <p>2. UPI transaction references and UTR settlement numbers are verified server-side with deduplication safeguards to prevent double-spending.</p>
                  <p>3. Administrative operations are recorded in immutable audit logs.</p>
                </>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalPolicy(null)}
                className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsSection
