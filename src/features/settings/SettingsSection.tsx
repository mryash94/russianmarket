import { useState } from 'react'
import {
  User,
  Bell,
  LogOut,
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { AuthPanel } from '../auth/AuthPanel'

type SettingsSectionProps = {
  isAdmin: boolean
  onToggleAdmin: () => void
}

export function SettingsSection({ isAdmin, onToggleAdmin }: SettingsSectionProps) {
  const { user, signOut } = useAuth()
  const [displayName, setDisplayName] = useState('Valued Collector')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [activeModalPolicy, setActiveModalPolicy] = useState<'privacy' | 'refund' | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div>
        <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-1">
          ACCOUNT GOVERNANCE
        </span>
        <h2 className="font-cinzel text-xl md:text-2xl font-bold text-white">
          Settings & Privacy Controls
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Manage your collector identity, security credentials, and review sovereign legal disclosures.
        </p>
      </div>

      {/* Supabase Authentication Panel (if not signed in) */}
      {!user && (
        <div className="glass-panel-glow rounded-3xl p-5 border border-cyan-500/30">
          <AuthPanel />
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center font-cinzel text-lg font-bold text-cyan-300">
              {(user?.email?.[0] ?? displayName[0] ?? 'R').toUpperCase()}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-space font-bold text-base text-white">{displayName}</h3>
              <span className="px-2 py-0.5 rounded-full font-mono-code text-[9px] uppercase font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {isAdmin ? 'ADMINISTRATOR' : user ? 'VERIFIED COLLECTOR' : 'GUEST SESSION'}
              </span>
            </div>
            <p className="text-xs font-mono-code text-slate-400 mt-0.5">
              {user?.email || 'Authenticated as Local Collector Session'}
            </p>
          </div>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-white/10 transition-all self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="glass-panel rounded-3xl p-5 md:p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-space font-bold text-sm text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Collector Profile Details</span>
          </h3>
          {savedSuccess && (
            <span className="text-xs font-mono-code text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settings Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono-code text-slate-400 mb-1">
              DISPLAY NAME
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full glass-input px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono-code text-slate-400 mb-1">
              PRIMARY EMAIL
            </label>
            <input
              type="email"
              disabled
              value={user?.email || 'collector@russianmarket.store'}
              className="w-full glass-input px-3.5 py-2 rounded-xl text-xs opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button type="submit" className="px-5 py-2 rounded-xl btn-cyan text-xs font-bold active:scale-95 transition-all">
            Update Profile
          </button>
        </div>
      </form>

      {/* Preferences & Notifications */}
      <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/10 space-y-3">
        <h3 className="font-space font-bold text-sm text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span>Notification Preferences</span>
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div>
            <span className="font-space font-medium text-xs text-white block">
              Cryptographic Vault Delivery Alerts
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Instant alerts when your master file signed tokens are activated.
            </span>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="w-4 h-4 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Legal & Sovereign Policies */}
      <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/10 space-y-3">
        <h3 className="font-space font-bold text-sm text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Sovereign Policies & Disclosures</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveModalPolicy('privacy')}
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all"
          >
            <div>
              <span className="font-space font-bold text-xs text-white block">
                Zero-Knowledge Privacy Policy
              </span>
              <span className="text-[10px] text-slate-400 font-mono-code">
                Encrypted customer asset custody
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModalPolicy('refund')}
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all"
          >
            <div>
              <span className="font-space font-bold text-xs text-white block">
                Refund & Settlement Policy
              </span>
              <span className="text-[10px] text-slate-400 font-mono-code">
                Immutable digital delivery rules
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Admin Panel Access Shortcut */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>ADMINISTRATIVE CONTROL ROOM</span>
        </div>
        <button
          type="button"
          onClick={onToggleAdmin}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 active:scale-95 transition-all"
        >
          Open Admin Control Room
        </button>
      </div>

      {/* Policy Viewer Dialog */}
      {activeModalPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-xl glass-panel-glow rounded-3xl p-6 border border-white/15 shadow-2xl">
            <h3 className="font-cinzel text-lg font-bold text-white mb-3">
              {activeModalPolicy === 'privacy'
                ? 'Zero-Knowledge Privacy Architecture'
                : 'Immutable Settlement & Refund Policy'}
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap mb-4">
              {activeModalPolicy === 'privacy'
                ? `Russian Market operates under strict zero-knowledge principles.
1. No functional bank credit card credentials, card numbers, or CVVs are ever requested, recorded, or processed.
2. All customer acquisitions are registered under unique anonymized cryptographic identifiers.
3. Your private master file download tokens are issued with 15-minute asymmetric signed keys and are never distributed to external data brokers.`
                : `1. Due to the mathematically irreversible nature of cryptographic digital asset delivery, acquisitions are immutable upon verified payment settlement.
2. In the verified event of an encrypted delivery disruption, our 24/7 Concierge will reissue a freshly signed ECDSA token or apply an immediate store credit balance adjustment.
3. Unverified or cancelled order attempts do not result in digital asset entitlements.`}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalPolicy(null)}
                className="px-4 py-2 rounded-xl btn-cyan text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
