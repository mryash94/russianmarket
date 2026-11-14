import { useState, useEffect, useId } from 'react'
import QRCode from 'qrcode'
import {
  X,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { storeEngine, type StoreSettings } from '../../services/storeEngine'
import { formatINR } from '../../lib/currency'

type AddMoneyModalProps = {
  isOpen: boolean
  onClose: () => void
  userId: string
  userEmail: string
  onDepositSuccess: () => void
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000] // In minor units (paise)

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [utrNumber, setUtrNumber] = useState('')
  const [depositRef, setDepositRef] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const modalId = useId()

  useEffect(() => {
    if (isOpen) {
      void storeEngine.getSettings().then((s) => {
        setSettings(s)
      })
      setStep('amount')
      setErrorMessage(null)
      setUtrNumber('')
      const randomRef = `RM-DEP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      setDepositRef(randomRef)
    }
  }, [isOpen])

  // Generate QR Code whenever entering 'pay' step
  useEffect(() => {
    if (step === 'pay' && settings) {
      const merchantId = settings.upiMerchantId || 'russianmarket@icici'
      const merchantName = settings.upiMerchantName || 'Russian Market Collectibles'
      const amountRupees = (amountMinor / 100).toFixed(2)
      const note = depositRef

      // Standard UPI Payment URI
      const upiUri = `upi://pay?pa=${encodeURIComponent(merchantId)}&pn=${encodeURIComponent(
        merchantName,
      )}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(note)}`

      QRCode.toDataURL(upiUri, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err))
    }
  }, [step, settings, amountMinor, depositRef])

  if (!isOpen) return null

  const minMinor = settings?.upiMinAmountMinor || 10000 // ₹100
  const maxMinor = settings?.upiMaxAmountMinor || 5000000 // ₹50,000

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

  const handleProceedToQR = () => {
    if (amountMinor < minMinor) {
      setErrorMessage(`Minimum deposit amount is ${formatINR(minMinor)}`)
      return
    }
    if (amountMinor > maxMinor) {
      setErrorMessage(`Maximum deposit amount is ${formatINR(maxMinor)}`)
      return
    }
    setErrorMessage(null)
    setStep('pay')
  }

  const handleCopyUPI = () => {
    if (!settings?.upiMerchantId) return
    navigator.clipboard.writeText(settings.upiMerchantId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitUTR = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUtr = utrNumber.trim()
    if (!cleanUtr || cleanUtr.length < 8) {
      setErrorMessage('Please enter a valid 12-digit UPI transaction reference / UTR number.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await storeEngine.createDepositRequest({
        userId,
        userEmail,
        amountMinor,
        utrNumber: cleanUtr,
        reference: depositRef,
        notes: `Customer deposit submitted via UPI QR`,
      })

      setStep('submitted')
      onDepositSuccess()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Deposit submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const upiUri = settings
    ? `upi://pay?pa=${encodeURIComponent(settings.upiMerchantId)}&pn=${encodeURIComponent(
        settings.upiMerchantName,
      )}&am=${(amountMinor / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(depositRef)}`
    : '#'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
    >
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated border border-white/[0.14] shadow-2xl p-5 sm:p-7 overflow-hidden my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Select Amount */}
        {step === 'amount' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  SOVEREIGN DEPOSIT
                </span>
              </div>
              <h3 id={`${modalId}-title`} className="font-space text-xl sm:text-2xl font-bold text-white">
                Add Money via UPI QR
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Instant UPI QR generation. Verified curatorial deposit credit.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-mono-code text-slate-300 font-medium">
                Select Amount (INR):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = amountMinor === amt
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPreset(amt)}
                      className={`py-2 px-2.5 rounded-xl font-mono-code text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                          : 'bg-white/[0.03] text-slate-300 hover:text-white border-white/[0.08] hover:bg-white/[0.06]'
                      }`}
                    >
                      {formatINR(amt)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Amount Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-code text-slate-300 font-medium">
                Or enter custom amount (₹):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-space font-bold text-slate-400 text-base">
                  ₹
                </span>
                <input
                  type="number"
                  min="100"
                  max="50000"
                  value={customAmountStr}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="w-full h-11 glass-input pl-8 pr-4 rounded-xl text-sm font-space font-bold text-white focus:border-cyan-400"
                  placeholder="1000"
                />
              </div>
              <span className="text-[10px] font-mono-code text-slate-400 block">
                Permitted range: {formatINR(minMinor)} – {formatINR(maxMinor)}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleProceedToQR}
              className="w-full h-11 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md mt-2"
            >
              <span>Generate UPI QR Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Scannable UPI QR & Submit UTR */}
        {step === 'pay' && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
                SCAN & PAY
              </span>
              <h3 className="font-space text-lg sm:text-xl font-bold text-white">
                Pay {formatINR(amountMinor)}
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Scan using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred)
              </p>
            </div>

            {/* Scannable High-Contrast QR Code */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/[0.08]">
              {qrDataUrl ? (
                <div className="p-2.5 bg-white rounded-xl shadow-lg border border-black/10">
                  <img
                    src={qrDataUrl}
                    alt={`UPI QR Code for ${formatINR(amountMinor)}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs font-mono-code">
                  Generating QR...
                </div>
              )}

              {/* Direct UPI Intent Link for mobile devices */}
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={upiUri}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-mono-code font-bold flex items-center gap-1.5 hover:bg-cyan-500/30 transition-all"
                >
                  <span>Open in UPI App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Merchant Details & One-Click Copy */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-xs font-mono-code">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 text-[11px]">Merchant UPI ID:</span>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  title="Copy UPI ID"
                >
                  <span>{settings?.upiMerchantId || 'russianmarket@icici'}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 text-[11px]">Order Reference:</span>
                <span className="font-bold text-white">{depositRef}</span>
              </div>
            </div>

            {/* UTR Input Form */}
            <form onSubmit={handleSubmitUTR} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-mono-code text-slate-300 font-medium">
                  Enter 12-Digit UPI Transaction ID / UTR:
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  placeholder="e.g. 431902847192"
                  className="w-full h-11 glass-input px-3.5 rounded-xl text-xs sm:text-sm font-mono-code placeholder:text-slate-500 focus:border-cyan-400 tracking-wider font-semibold"
                  required
                />
                <span className="text-[10px] font-mono-code text-slate-400 block">
                  Find the 12-digit UTR in your payment details screen in GPay, PhonePe, or Paytm.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('amount')}
                  className="h-10 rounded-xl btn-ghost text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !utrNumber.trim()}
                  className="h-10 rounded-xl btn-primary text-xs font-bold disabled:opacity-40 transition-all shadow-md"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Submitted Confirmation State */}
        {step === 'submitted' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono-code text-[10px] font-bold">
                AUDIT VERIFICATION PENDING
              </span>
              <h3 className="font-space text-xl font-bold text-white pt-1">
                Deposit Submitted Successfully
              </h3>
              <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
                Your deposit request for <strong className="text-white">{formatINR(amountMinor)}</strong> has been registered in the ledger.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left text-xs font-mono-code space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-bold text-white">{depositRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted UTR:</span>
                <span className="font-bold text-cyan-400">{utrNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-amber-400 font-bold">Pending Admin Audit</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-sans">
              Balances are credited immediately once curatorial verification matches your transaction reference.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-xl btn-primary text-xs font-bold"
            >
              Done & Return to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddMoneyModal
