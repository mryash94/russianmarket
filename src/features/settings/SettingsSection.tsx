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
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div>
        <h2 className="font-space text-xl md:text-2xl font-semibold text-[#ededed] tracking-tight">
          Account & settings
        </h2>
        <p className="text-xs text-[#9499a6] font-sans mt-0.5">
          Manage your collector profile, notifications, and store policies
        </p>
      </div>

      {/* Supabase Authentication Panel (if not signed in) */}
      {!user && (
        <div className="rounded-2xl p-5 bg-[#0c0e13] border border-white/[0.08]">
          <AuthPanel />
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="rounded-2xl p-4 sm:p-6 bg-[#0c0e13] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#181c25] border border-white/[0.1] flex items-center justify-center font-space text-base font-semibold text-[#ededed]">
            {(user?.email?.[0] ?? displayName[0] ?? 'R').toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-space font-medium text-sm sm:text-base text-[#ededed]">{displayName}</h3>
              <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-white/[0.05] text-[#9499a6] border border-white/[0.08]">
                {isAdmin ? 'Administrator' : user ? 'Verified' : 'Guest'}
              </span>
            </div>
            <p className="text-xs font-mono-code text-[#666b7a] mt-0.5 truncate max-w-[220px] sm:max-w-none">
              {user?.email || 'Local Collector Session'}
            </p>
          </div>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg btn-ghost text-xs font-medium text-[#f87171] hover:text-[#f87171] transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        )}
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl p-4 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
            <User className="w-4 h-4 text-white/50" />
            <span>Profile details</span>
          </h3>
          {savedSuccess && (
            <span className="text-xs font-mono-code text-[#34d399] flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-sans text-[#9499a6] mb-1">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 bg-[#181c25] border border-white/[0.08] focus:border-white/30 px-3.5 rounded-lg text-xs text-[#ededed]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans text-[#9499a6] mb-1">
              Email address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || 'collector@russianmarket.store'}
              className="w-full h-10 bg-[#181c25] border border-white/[0.08] px-3.5 rounded-lg text-xs text-[#666b7a] cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button type="submit" className="px-5 py-2 rounded-lg btn-primary text-xs font-semibold active:scale-98 transition-all">
            Save changes
          </button>
        </div>
      </form>

      {/* Preferences & Notifications */}
      <div className="rounded-2xl p-4 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3">
        <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
          <Bell className="w-4 h-4 text-white/50" />
          <span>Notifications</span>
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
          <div className="pr-4">
            <span className="font-space font-medium text-xs text-[#ededed] block">
              Digital Vault Delivery Alerts
            </span>
            <span className="text-[11px] text-[#9499a6] font-sans">
              Instant notification when purchased collectible assets are ready.
            </span>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="w-4 h-4 accent-white cursor-pointer flex-shrink-0"
          />
        </div>
      </div>

      {/* Store Policies */}
      <div className="rounded-2xl p-4 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3">
        <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/50" />
          <span>Store policies</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveModalPolicy('privacy')}
            className="p-3.5 rounded-xl bg-[#12151c] hover:bg-[#181c25] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
          >
            <div>
              <span className="font-space font-medium text-xs text-[#ededed] block">
                Privacy policy
              </span>
              <span className="text-[10px] text-[#9499a6] font-sans">
                Customer privacy and data security
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
                Refund & delivery policy
              </span>
              <span className="text-[10px] text-[#9499a6] font-sans">
                Digital delivery and support terms
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Admin Panel Access Shortcut */}
      <div className="p-4 rounded-xl bg-[#0c0e13] border border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono-code text-[#9499a6]">
          <SlidersHorizontal className="w-4 h-4 text-white/70" />
          <span>Admin control room</span>
        </div>
        <button
          type="button"
          onClick={onToggleAdmin}
          className="px-3.5 py-1.5 rounded-lg btn-ghost text-xs font-medium hover:text-white transition-colors"
        >
          Open admin dashboard
        </button>
      </div>

      {/* Policy Viewer Dialog */}
      {activeModalPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#0c0e13] rounded-2xl p-6 border border-white/[0.1] shadow-2xl">
            <h3 className="font-space text-lg font-semibold text-[#ededed] mb-3">
              {activeModalPolicy === 'privacy'
                ? 'Privacy Policy'
                : 'Refund & Delivery Policy'}
            </h3>
            <p className="text-xs text-[#9499a6] font-sans leading-relaxed whitespace-pre-wrap mb-4">
              {activeModalPolicy === 'privacy'
                ? `1. Russian Market respects customer privacy. We never store functional bank card credentials or CVVs.
2. Orders and accounts are securely registered and protected under verified database encryption.
3. High-resolution master asset downloads are delivered via secure on-demand download tokens.`
                : `1. All collectible digital assets are delivered via the secure Digital Vault upon payment verification.
2. Due to the digital nature of instant master file downloads, purchases are final once verified and unlocked.
3. If you experience any delivery difficulty or corrupted downloads, our Concierge Support team will reissue your download or provide account credit.`}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalPolicy(null)}
                className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold"
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

export default SettingsSection
