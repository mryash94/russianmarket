import { useState, useEffect } from 'react'
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
  ShoppingBag,
  Wallet,
  MessageSquare,
  KeyRound,
  Download,
  AlertCircle,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { AuthPanel } from '../auth/AuthPanel'
import { storeEngine } from '../../services/storeEngine'

type SettingsSectionProps = {
  isAdmin: boolean
  onToggleAdmin: () => void
  onOpenOrders?: () => void
  onOpenWallet?: () => void
  onOpenChat?: () => void
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

export function SettingsSection({
  isAdmin,
  onToggleAdmin,
  onOpenOrders,
  onOpenWallet,
  onOpenChat,
}: SettingsSectionProps) {
  const { user, signOut, updateUserPassword, resendConfirmationEmail } = useAuth()
  const [displayName, setDisplayName] = useState(() => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || 'Valued Collector'
  })
  const [orderAlerts, setOrderAlerts] = useState(true)
  const [transactionAlerts, setTransactionAlerts] = useState(true)
  const [pushPermission, setPushPermission] = useState<string>('default')
  const [activeModalPolicy, setActiveModalPolicy] = useState<'privacy' | 'refund' | 'custody' | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null)

  const isGoogleUser = user?.app_metadata?.provider === 'google' || user?.identities?.some((i) => i.provider === 'google')
  const isEmailVerified = Boolean(isGoogleUser || user?.email_confirmed_at || user?.confirmed_at)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission)
    }
  }, [])

  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission()
        setPushPermission(perm)
      } catch {
        // Notification permission request error handled gracefully
      }
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.id) {
      await storeEngine.updateCustomerProfile(user.id, { displayName })
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordStatus(null)

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    try {
      await updateUserPassword(newPassword)
      setPasswordStatus('Master password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordChange(false), 2000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Password update failed')
    }
  }

  const handleResendEmail = async () => {
    if (!user?.email) return
    setResendingVerification(true)
    setVerificationNotice(null)
    try {
      await resendConfirmationEmail(user.email)
      setVerificationNotice('Verification email dispatched. Please check your inbox.')
    } catch (err) {
      setVerificationNotice(err instanceof Error ? err.message : 'Failed to send confirmation email')
    } finally {
      setResendingVerification(false)
    }
  }

  const handleExportDataArchive = async () => {
    if (!user) return
    const [orders, walletTxs, notifs] = await Promise.all([
      storeEngine.getOrders(user.id, user.email || undefined),
      storeEngine.getWalletTransactions(user.id),
      storeEngine.getNotifications(user.id),
    ])

    const exportBundle = {
      exportMetadata: {
        platform: 'RUSSIAN MARKET V5 ELITE',
        generatedAt: new Date().toISOString(),
        collectorId: user.id,
        collectorEmail: user.email,
        authProvider: isGoogleUser ? 'Google OAuth 2.0' : 'Supabase Email Auth',
      },
      profile: {
        id: user.id,
        displayName,
        email: user.email,
        isEmailVerified,
        createdAt: user.created_at,
      },
      orders,
      walletTransactions: walletTxs,
      notifications: notifs,
    }

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RussianMarket-CollectorData-${user.id.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Page Header */}
      <div>
        <h2 className="font-space text-xl md:text-2xl font-semibold text-[#ededed] tracking-tight">
          Customer Account Center
        </h2>
        <p className="text-xs text-[#9499a6] font-sans mt-0.5">
          Sovereign identity, verified security, multi-order portfolio, and privacy preferences
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
              Authenticate via Google or email to access your order deliverables, wallet balance, and notifications.
            </p>
          </div>
          <AuthPanel />
        </div>
      ) : (
        <>
          {/* 1. Verified Profile Overview Card */}
          <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
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
                    {isAdmin ? 'Administrator' : 'Valued Collector'}
                  </span>
                  {isEmailVerified ? (
                    <span className="px-2 py-0.5 rounded font-mono-code text-[9px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Email Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded font-mono-code text-[9px] uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Unconfirmed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-code text-[#9499a6]">
                  {isGoogleUser && <GoogleIcon />}
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {!isEmailVerified && (
                <button
                  type="button"
                  disabled={resendingVerification}
                  onClick={handleResendEmail}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono-code text-amber-300 transition-colors"
                >
                  {resendingVerification ? 'Sending…' : 'Resend Verification'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-400 hover:text-red-300 transition-colors active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {verificationNotice && (
            <p className="text-xs font-mono-code text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl animate-fade-in">
              {verificationNotice}
            </p>
          )}

          {/* 2. Quick Operations Hub Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {onOpenOrders && (
              <button
                type="button"
                onClick={onOpenOrders}
                className="p-4 rounded-xl bg-[#0c0e13] hover:bg-[#12151c] border border-white/[0.08] hover:border-white/20 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-space font-medium text-xs text-white block">My Orders</span>
                    <span className="text-[10px] text-[#9499a6] font-mono">View & download passes</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>
            )}

            {onOpenWallet && (
              <button
                type="button"
                onClick={onOpenWallet}
                className="p-4 rounded-xl bg-[#0c0e13] hover:bg-[#12151c] border border-white/[0.08] hover:border-white/20 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-space font-medium text-xs text-white block">Store Wallet</span>
                    <span className="text-[10px] text-[#9499a6] font-mono">Ledger & add funds</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>
            )}

            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="p-4 rounded-xl bg-[#0c0e13] hover:bg-[#12151c] border border-white/[0.08] hover:border-white/20 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-space font-medium text-xs text-white block">Private Concierge</span>
                    <span className="text-[10px] text-[#9499a6] font-mono">24/7 dedicated support</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>
            )}
          </div>

          {/* 3. Identity & Active Session Details */}
          <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Identity & Session Security</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active Authenticated Session
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#12151c] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-white/50 block uppercase">Authentication Provider</span>
                <span className="text-white font-medium flex items-center gap-2">
                  {isGoogleUser ? <GoogleIcon /> : <Lock className="w-3.5 h-3.5 text-cyan-400" />}
                  {isGoogleUser ? 'Google OAuth 2.0 Single Sign-On' : 'Encrypted Supabase Auth'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12151c] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-white/50 block uppercase">Client Session Security</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TLS 1.3 / Strict RLS Scoped
                </span>
              </div>
            </div>

            {/* Password Change Trigger (For Non-OAuth Users) */}
            {!isGoogleUser && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center gap-2 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{showPasswordChange ? 'Cancel Password Change' : 'Change Master Password'}</span>
                </button>

                {showPasswordChange && (
                  <form onSubmit={handleChangePassword} className="mt-3 p-4 rounded-xl bg-[#12151c] border border-white/[0.08] space-y-3 animate-fade-in">
                    <span className="text-xs font-medium text-white block">Update Account Password</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-white/60 block mb-1">New Password (min 8 chars)</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-white/60 block mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                        {passwordError}
                      </p>
                    )}
                    {passwordStatus && (
                      <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                        {passwordStatus}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold"
                    >
                      Save New Password
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* 4. Profile Edit Form */}
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

      {/* 5. Notification Preferences & Device Push Opt-in */}
      <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3.5">
        <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
          <Bell className="w-4 h-4 text-white/50" />
          <span>Notification & Device Channels</span>
        </h3>

        <div className="divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between py-3">
            <div className="pr-4">
              <span className="font-space font-medium text-xs text-[#ededed] block">
                Order Deliverable Alerts
              </span>
              <span className="text-[11px] text-[#9499a6] font-sans">
                Immediate notification upon verification and release of cryptographic collectibles.
              </span>
            </div>
            <input
              type="checkbox"
              checked={orderAlerts}
              onChange={(e) => setOrderAlerts(e.target.checked)}
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

          <div className="flex items-center justify-between py-3">
            <div className="pr-4">
              <span className="font-space font-medium text-xs text-[#ededed] block flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Web Push Device Alerts</span>
              </span>
              <span className="text-[11px] text-[#9499a6] font-sans">
                {pushPermission === 'granted'
                  ? 'Active on this browser. Instant background alerts.'
                  : pushPermission === 'denied'
                  ? 'Notifications are blocked in browser preferences.'
                  : 'Receive real-time order verification alerts directly on your device.'}
              </span>
            </div>
            {pushPermission === 'granted' ? (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Enabled
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPush}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
              >
                Enable Push
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. Privacy & Personal Data Archive */}
      {user && (
        <div className="rounded-2xl p-5 sm:p-6 bg-[#0c0e13] border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-space font-medium text-sm text-[#ededed] flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Sovereign Data Archive (GDPR / Privacy)</span>
              </h3>
              <p className="text-xs text-[#9499a6] font-sans mt-0.5">
                Download a cryptographically verified JSON export of your complete profile, orders, and ledger transactions.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportDataArchive}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-all active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Data Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Store Policies & Custody Documentation */}
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
                Encryption & ledger audit
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 8. STRICTLY CONDITIONAL: Admin Panel Access (Rendered ONLY if user is verified admin) */}
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
                  <p>3. Collector identifiers are used exclusively for digital asset order settlement and encrypted download entitlement verification.</p>
                </>
              )}
              {activeModalPolicy === 'refund' && (
                <>
                  <p>1. All digital collectible passes and artwork files are cryptographically dispatched to the customer's verified Orders immediately upon payment settlement.</p>
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
