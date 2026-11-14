import { X } from 'lucide-react'
import { AuthPanel } from './AuthPanel'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
  subtitle?: string
  initialMode?: 'sign-in' | 'sign-up' | 'forgot-password'
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
  initialMode = 'sign-up',
}: AuthModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#0c0e12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-1"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all"
          aria-label="Close authentication"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-2 sm:p-4">
          {title && (
            <div className="mb-4 text-center">
              <h3 className="text-base font-bold text-white">{title}</h3>
              {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
            </div>
          )}
          <AuthPanel onAuthSuccess={onSuccess} initialMode={initialMode} />
        </div>
      </div>
    </div>
  )
}
