import { useEffect, useState } from 'react'
import {
  X,
  ShieldAlert,
  Download,
  FileArchive,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { storeEngine, type CustomerEntitlement } from '../../services/storeEngine'
import { DigitalDeliveryService } from '../../services/digitalDeliveryService'

type DigitalVaultModalProps = {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function DigitalVaultModal({ isOpen, onClose, userId }: DigitalVaultModalProps) {
  const [entitlements, setEntitlements] = useState<CustomerEntitlement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDownload, setActiveDownload] = useState<{
    id: string
    url: string
    filename: string
    expiresAt: string
  } | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const fetchVault = async () => {
      setLoading(true)
      const list = await storeEngine.getCustomerEntitlements(userId)
      setEntitlements(list)
      setLoading(false)
    }
    fetchVault()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'vault_updated' || event === 'order_updated') {
        fetchVault()
      }
    })
    return () => unsubscribe()
  }, [isOpen, userId])

  if (!isOpen) return null

  const handleDownload = async (entitlement: CustomerEntitlement) => {
    setDownloadingId(entitlement.id)
    try {
      const res = await DigitalDeliveryService.requestSignedDownload({
        userId,
        entitlementId: entitlement.id,
        productId: entitlement.productId,
        orderId: entitlement.orderId,
      })

      if (res.authorized && res.downloadUrl && res.filename && res.expiresAt) {
        setActiveDownload({
          id: entitlement.id,
          url: res.downloadUrl,
          filename: res.filename,
          expiresAt: res.expiresAt,
        })
        // Refresh entitlement counts
        const list = await storeEngine.getCustomerEntitlements(userId)
        setEntitlements(list)
      } else {
        alert(res.errorMessage || 'Authorization failed')
      }
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel-glow rounded-3xl p-5 md:p-8 border border-white/15 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass-input text-slate-400 hover:text-white"
          aria-label="Close vault"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <ShieldAlert className="w-6 h-6 text-violet-400" />
          <h2 id="vault-title" className="font-cinzel text-xl md:text-2xl font-bold text-white">
            Encrypted Digital Vault
          </h2>
        </div>

        <p className="text-xs text-slate-300 font-sans mb-6">
          Authorized repository for your verified digital collectible master assets.
          Every download is signed on-demand with asymmetric cryptographic credentials.
        </p>

        {/* Active Signed Token Alert (if generated) */}
        {activeDownload && (
          <div className="mb-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-space font-bold text-xs text-violet-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-violet-400" />
                SIGNED TOKEN ACTIVE
              </span>
              <span className="text-[10px] font-mono-code text-slate-400">
                EXPIRES AT: {activeDownload.expiresAt}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              Your 15-minute download token for <strong>{activeDownload.filename}</strong> has been generated and logged.
            </p>
            <div className="pt-1">
              <a
                href={activeDownload.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-violet text-xs font-bold active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Save Asset File (.ZIP)</span>
              </a>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono-code">
            Verifying cryptographic entitlements...
          </div>
        ) : entitlements.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Lock className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-space font-semibold text-slate-300 text-sm">
              Your Vault is Currently Empty
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans leading-relaxed">
              Digital master files unlock automatically as soon as your collectible orders are verified.
              Initiate an order or verify pending orders in the Admin Control Room.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entitlements.map((e) => {
              const formattedDate = new Date(e.grantedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              const isGenerating = downloadingId === e.id

              return (
                <div
                  key={e.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-space font-bold text-sm text-white">
                          {e.productTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-mono-code text-[9px] uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {e.collection}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-code text-slate-400 block mt-0.5">
                        SKU: {e.sku} • Granted: {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono-code text-slate-400">
                        Downloads: <strong className="text-cyan-300">{e.downloadCount}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleDownload(e)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-cyan text-xs font-bold active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isGenerating ? 'Signing...' : 'Request Download'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
                    <span className="flex items-center gap-1.5 truncate max-w-[280px]">
                      <FileArchive className="w-4 h-4 text-violet-400" />
                      {e.digitalAssetName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      VERIFIED ENTITLEMENT
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono-code text-slate-500">
          <span>ZERO-KNOWLEDGE ARCHIVE VAULT</span>
          <span>COMPLIANT WITH ASYMMETRIC KEY DELIVERY</span>
        </div>
      </div>
    </div>
  )
}
