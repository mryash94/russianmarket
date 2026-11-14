import { useState, useEffect, useId } from 'react'
import QRCode from 'qrcode'
import {
  X,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Clock,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import {
  storeEngine,
  type StoreSettings,
  type PaymentRequestRecord,
} from '../../services/storeEngine'
import { formatINR } from '../../lib/currency'

type AddMoneyModalProps = {
  isOpen: boolean
  onClose: () => void
  userId: string
  userEmail: string
  onDepositSuccess: () => void
}

const ACTIVE_PAYMENT_STORAGE_KEY = 'rm_active_payment_request_v2'

export function AddMoneyModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onDepositSuccess,
}: AddMoneyModalProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [amountMinor, setAmountMinor] = useState<number>(100000) // ₹1,000
  const [customAmountStr, setCustomAmountStr] = useState<string>('1000')
  const [step, setStep] = useState<'amount' | 'pay' | 'submitted'>('amount')
  const [activeRequest, setActiveRequest] = useState<PaymentRequestRecord | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [utrNumber, setUtrNumber] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const modalId = useId()

  // 1. Load settings & restore active payment session if still valid
  useEffect(() => {
    if (isOpen) {
      void storeEngine.getSettings().then((s) => {
        setSettings(s)
      })
      setErrorMessage(null)

      // Restore active payment session if user reopened modal
      try {
        const saved = sessionStorage.getItem(ACTIVE_PAYMENT_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as PaymentRequestRecord
          const expTime = new Date(parsed.expiresAt).getTime()
          if (expTime > Date.now()) {
            setActiveRequest(parsed)
            setAmountMinor(parsed.amountMinor)
            setStep('pay')
            return
          } else {
            sessionStorage.removeItem(ACTIVE_PAYMENT_STORAGE_KEY)
          }
        }
      } catch {
        sessionStorage.removeItem(ACTIVE_PAYMENT_STORAGE_KEY)
      }

      setStep('amount')
      setUtrNumber('')
    }
  }, [isOpen])

  // 2. Countdown Timer Ticker
  useEffect(() => {
    if (step !== 'pay' || !activeRequest?.expiresAt) return

    const updateTimer = () => {
      const exp = new Date(activeRequest.expiresAt).getTime()
      const diff = Math.max(0, Math.floor((exp - Date.now()) / 1000))
      setRemainingSeconds(diff)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [step, activeRequest?.expiresAt])

  // 3. Generate QR Code whenever activeRequest changes
  useEffect(() => {
    if (step === 'pay' && activeRequest && settings) {
      const merchantId = activeRequest.merchantUpiId || settings.upiMerchantId || 'russianmarket@icici'
      const merchantName = activeRequest.merchantDisplayName || settings.upiMerchantName || 'Russian Market Collectibles'
      const amountRupees = (activeRequest.amountMinor / 100).toFixed(2)
      const note = activeRequest.reference

      // Official NPCI Standard UPI Payment URI
      const upiUri = `upi://pay?pa=${encodeURIComponent(merchantId)}&pn=${encodeURIComponent(
        merchantName,
      )}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(note)}`

      QRCode.toDataURL(upiUri, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#060709',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err))
    }
  }, [step, activeRequest, settings])

  if (!isOpen) return null

  const minMinor = settings?.upiMinAmountMinor || 10000 // ₹100
  const maxMinor = settings?.upiMaxAmountMinor || 5000000 // ₹50,000
  const presets = settings?.upiFixedAmounts || [50000, 100000, 200000, 500000, 1000000]
  const isExpired = step === 'pay' && remainingSeconds <= 0

  const handleSelectPreset = (minor: number) => {
    setAmountMinor(minor)
    setCustomAmountStr((minor / 100).toString())
    setErrorMessage(null)
  }

  const handleCustomChange = (val: string) => {
    setCustomAmountStr(val)
    const parsed = parseInt(val, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setAmountMinor(parsed * 100)
      setErrorMessage(null)
    }
  }

  const handleProceedToQR = async () => {
    if (amountMinor < minMinor) {
      setErrorMessage(`Minimum deposit amount is ${formatINR(minMinor)}`)
      return
    }
    if (amountMinor > maxMinor) {
      setErrorMessage(`Maximum deposit amount is ${formatINR(maxMinor)}`)
      return
    }
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const req = await storeEngine.createPaymentRequest({
        userId,
        userEmail,
        amountMinor,
      })
      setActiveRequest(req)
      sessionStorage.setItem(ACTIVE_PAYMENT_STORAGE_KEY, JSON.stringify(req))
      setStep('pay')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not create payment session.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateFreshQR = async () => {
    sessionStorage.removeItem(ACTIVE_PAYMENT_STORAGE_KEY)
    await handleProceedToQR()
  }

  const handleCopyUPI = () => {
    const upi = activeRequest?.merchantUpiId || settings?.upiMerchantId
    if (!upi) return
    navigator.clipboard.writeText(upi)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitUTR = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isExpired) {
      setErrorMessage('This payment session has expired. Please generate a fresh QR code.')
      return
    }

    const cleanUtr = utrNumber.trim()
    if (!cleanUtr || cleanUtr.length < 8) {
      setErrorMessage('Please enter a valid 12-digit UPI transaction reference / UTR number')
      return
    }

    if (!activeRequest) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await storeEngine.submitPaymentUtr(activeRequest.id, cleanUtr)
      // Also record legacy deposit request for compatibility
      await storeEngine.createDepositRequest({
        userId,
        userEmail,
        amountMinor: activeRequest.amountMinor,
        utrNumber: cleanUtr,
        reference: activeRequest.reference,
        notes: `Customer deposit submitted via UPI QR`,
      }).catch(() => {})

      sessionStorage.removeItem(ACTIVE_PAYMENT_STORAGE_KEY)
      setStep('submitted')
      onDepositSuccess()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Deposit submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0c0e13] rounded-3xl p-6 sm:p-7 border border-white/[0.08] shadow-2xl flex flex-col gap-5 text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181c25] border border-white/[0.08] flex items-center justify-center text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                INSTANT VAULT SETTLEMENT
              </span>
              <h2 id={`${modalId}-title`} className="text-base font-bold text-white tracking-tight">
                Add Funds via UPI
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: SELECT AMOUNT */}
        {step === 'amount' && (
          <div className="space-y-5">
            <p className="text-xs text-white/60">
              Select or enter the exact amount you wish to deposit into your private collector wallet.
            </p>

            {/* Quick preset chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-white/40 uppercase">Quick Amounts</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {presets.map((preset) => {
                  const isSelected = amountMinor === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`py-2 px-2.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-sm'
                          : 'bg-[#12151c] border-white/[0.06] text-white/70 hover:border-white/20'
                      }`}
                    >
                      {formatINR(preset)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Amount Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-white/40 uppercase">Deposit Amount (₹ INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={minMinor / 100}
                  max={maxMinor / 100}
                  step="100"
                  value={customAmountStr}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="w-full h-12 pl-8 pr-4 rounded-xl bg-[#12151c] border border-white/[0.08] text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-white/40 pt-1">
                <span>Min: {formatINR(minMinor)}</span>
                <span>Max: {formatINR(maxMinor)}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleProceedToQR()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-cyan-500/10"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Generate Dynamic UPI QR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: SCAN UPI QR & COUNTDOWN TIMER */}
        {step === 'pay' && activeRequest && (
          <div className="space-y-4">
            {/* Top Bar with Timer */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isExpired
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isExpired ? 'text-rose-400' : 'animate-pulse text-cyan-400'}`} />
                <span className="text-xs font-mono font-semibold uppercase">
                  {isExpired ? 'Session Expired' : 'Payment Window Active'}
                </span>
              </div>
              <span className="text-sm font-mono font-bold">
                {isExpired ? '00:00' : formatTimer(remainingSeconds)}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="UPI Payment QR Code"
                  className={`w-52 h-52 object-contain transition-opacity duration-300 ${
                    isExpired ? 'opacity-25 grayscale' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="mt-2 text-center text-black">
                <span className="text-[11px] font-mono font-semibold text-neutral-500 uppercase tracking-wider block">
                  Exact Amount to Pay
                </span>
                <span className="text-xl font-bold font-mono tracking-tight text-black">
                  {formatINR(activeRequest.amountMinor)}
                </span>
              </div>
            </div>

            {isExpired && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-2 text-center">
                <p>To avoid payment failures, this QR code has expired.</p>
                <button
                  type="button"
                  onClick={() => void handleGenerateFreshQR()}
                  className="w-full py-2 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate Fresh Payment QR
                </button>
              </div>
            )}

            {/* Merchant UPI Details Pill */}
            <div className="p-3 bg-[#12151c] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] text-white/40 uppercase block">Configured Merchant UPI</span>
                <span className="text-white font-semibold select-all">
                  {activeRequest.merchantUpiId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUPI}
                className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-[11px] flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Reference info */}
            <div className="p-3 bg-[#12151c] border border-white/[0.06] rounded-xl space-y-1 text-xs">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-white/40">Order Ref:</span>
                <span className="text-cyan-400 font-semibold">{activeRequest.reference}</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pt-1">
                {settings?.upiInstructions || 'Scan with GPay, PhonePe, Paytm, or BHIM. After paying, enter your 12-digit UPI UTR number below.'}
              </p>
            </div>

            {/* Mobile Direct UPI Intent Link */}
            <a
              href={`upi://pay?pa=${encodeURIComponent(
                activeRequest.merchantUpiId || settings?.upiMerchantId || 'russianmarket@icici'
              )}&pn=${encodeURIComponent(
                activeRequest.merchantDisplayName || settings?.upiMerchantName || 'Russian Market Collectibles'
              )}&am=${(activeRequest.amountMinor / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(activeRequest.reference)}`}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400/15 to-emerald-400/15 hover:from-cyan-400/25 hover:to-emerald-400/25 border border-cyan-400/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 sm:hidden"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Tap to Pay with UPI App (GPay / PhonePe / Paytm)</span>
            </a>

            {/* UTR Submission Form */}
            <form onSubmit={(e) => void handleSubmitUTR(e)} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-white/60 uppercase">
                  12-Digit UPI Transaction / UTR Number
                </label>
                <input
                  type="text"
                  required
                  disabled={isExpired || isSubmitting}
                  placeholder="e.g. 432109876543"
                  maxLength={24}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#12151c] border border-white/[0.08] text-white font-mono text-sm tracking-wider focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-40"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('amount')}
                  className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
                >
                  Change Amount
                </button>
                <button
                  type="submit"
                  disabled={isExpired || isSubmitting || !utrNumber.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-98 shadow-md"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SUBMITTED CONFIRMATION */}
        {step === 'submitted' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">Deposit Submitted!</h3>
              <p className="text-xs text-white/60 max-w-sm mx-auto">
                Your payment reference has been securely registered with the Russian Market treasury. Funds will reflect in your wallet upon curatorial settlement.
              </p>
            </div>

            <div className="p-3.5 bg-[#12151c] border border-white/[0.06] rounded-xl font-mono text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-white/40">Amount:</span>
                <span className="text-emerald-400 font-bold">{formatINR(amountMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">UTR Number:</span>
                <span className="text-white font-medium">{utrNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Status:</span>
                <span className="text-amber-400 font-medium">Pending Review</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white text-black hover:bg-neutral-100 font-semibold text-xs transition-transform active:scale-98"
            >
              Done & Return to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
