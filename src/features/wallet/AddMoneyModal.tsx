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
      setErrorMessage('Please enter a valid 12-digit UPI transaction reference / UTR number')
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0c0e13] border border-white/[0.1] shadow-2xl p-5 sm:p-7 overflow-hidden my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-lg text-slate-400 hover:text-white bg-[#181c25] border border-white/[0.08] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Select Amount */}
        {step === 'amount' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#181c25] border border-white/[0.1] flex items-center justify-center text-white">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <span className="font-mono-code text-[10px] uppercase font-medium tracking-wider text-[#9499a6]">
                  Wallet deposit
                </span>
              </div>
              <h3 id={`${modalId}-title`} className="font-space text-xl font-semibold text-[#ededed]">
                Add money via UPI QR
              </h3>
              <p className="text-xs text-[#9499a6] font-sans mt-0.5">
                Instant UPI QR generation with curatorial audit verification
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-sans text-[#9499a6]">
                Select amount:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = amountMinor === amt
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPreset(amt)}
                      className={`py-2 px-2.5 rounded-lg font-space text-xs font-medium transition-colors border tabular-nums ${
                        isSelected
                          ? 'bg-white text-black border-white'
                          : 'bg-[#181c25] text-[#ededed] hover:text-white border-white/[0.08] hover:border-white/20'
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
              <label className="block text-xs font-sans text-[#9499a6]">
                Or enter custom amount (₹):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-space font-semibold text-[#666b7a] text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="100"
                  max="50000"
                  value={customAmountStr}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="w-full h-11 bg-[#181c25] border border-white/[0.08] focus:border-white/30 pl-8 pr-4 rounded-lg text-sm font-space font-semibold text-[#ededed] tabular-nums"
                  placeholder="1000"
                />
              </div>
              <span className="text-[11px] font-mono-code text-[#666b7a] block">
                Permitted range: {formatINR(minMinor)} – {formatINR(maxMinor)}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[#f87171] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleProceedToQR}
              className="w-full h-11 rounded-lg btn-primary text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all mt-2"
            >
              <span>Generate UPI QR code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Scannable UPI QR & Submit UTR */}
        {step === 'pay' && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="font-mono-code text-[10px] uppercase font-medium tracking-wider text-[#9499a6] block mb-0.5">
                Scan & pay
              </span>
              <h3 className="font-space text-lg sm:text-xl font-semibold text-[#ededed] tabular-nums">
                Pay {formatINR(amountMinor)}
              </h3>
              <p className="text-xs text-[#9499a6] font-sans mt-0.5">
                Scan using Google Pay, PhonePe, Paytm, BHIM, or Cred
              </p>
            </div>

            {/* Scannable High-Contrast QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#12151c] border border-white/[0.07]">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-lg shadow border border-black/10">
                  <img
                    src={qrDataUrl}
                    alt={`UPI QR Code for ${formatINR(amountMinor)}`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
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
                  className="px-3.5 py-1.5 rounded-lg btn-ghost text-xs font-mono-code font-medium flex items-center gap-1.5 transition-colors"
                >
                  <span>Open in UPI app</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Merchant Details & One-Click Copy */}
            <div className="p-3 rounded-lg bg-[#12151c] border border-white/[0.06] space-y-1.5 text-xs font-mono-code">
              <div className="flex items-center justify-between text-[#ededed]">
                <span className="text-[#9499a6] text-[11px]">Merchant UPI ID:</span>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="flex items-center gap-1 font-medium text-white hover:text-slate-300 transition-colors"
                  title="Copy UPI ID"
                >
                  <span>{settings?.upiMerchantId || 'russianmarket@icici'}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-[#34d399]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-[#ededed]">
                <span className="text-[#9499a6] text-[11px]">Reference:</span>
                <span className="font-medium text-white">{depositRef}</span>
              </div>
            </div>

            {/* UTR Input Form */}
            <form onSubmit={handleSubmitUTR} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-sans text-[#9499a6]">
                  Enter 12-digit bank UTR / transaction ID:
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  placeholder="e.g. 431902847192"
                  className="w-full h-10 bg-[#181c25] border border-white/[0.08] focus:border-white/30 px-3.5 rounded-lg text-xs sm:text-sm font-mono-code placeholder:text-slate-500 tracking-wider tabular-nums"
                  required
                />
                <span className="text-[10px] font-mono-code text-[#666b7a] block">
                  Find the 12-digit UTR in your payment details screen in your UPI app.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[#f87171] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('amount')}
                  className="h-10 rounded-lg btn-ghost text-xs font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !utrNumber.trim()}
                  className="h-10 rounded-lg btn-primary text-xs font-semibold disabled:opacity-40 transition-all"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for verification'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Submitted Confirmation State */}
        {step === 'submitted' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mx-auto text-white">
              <Clock className="w-6 h-6 text-[#fbbf24]" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[#fbbf24] font-mono-code text-[10px] font-medium">
                <span className="status-beacon pending" />
                <span>Audit verification pending</span>
              </div>
              <h3 className="font-space text-lg font-semibold text-[#ededed] pt-1">
                Deposit submitted successfully
              </h3>
              <p className="text-xs text-[#9499a6] font-sans max-w-sm mx-auto">
                Your deposit request for <strong className="text-white">{formatINR(amountMinor)}</strong> has been registered in the audit queue.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#12151c] border border-white/[0.07] text-left text-xs font-mono-code space-y-1">
              <div className="flex justify-between">
                <span className="text-[#9499a6]">Reference:</span>
                <span className="font-medium text-white">{depositRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9499a6]">Submitted UTR:</span>
                <span className="font-medium text-white tabular-nums">{utrNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9499a6]">Status:</span>
                <span className="text-[#fbbf24] font-medium">Pending admin audit</span>
              </div>
            </div>

            <p className="text-[11px] text-[#9499a6] font-sans">
              Balances are credited immediately once curatorial verification matches your transaction reference.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-lg btn-primary text-xs font-semibold"
            >
              Done & return to wallet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddMoneyModal
