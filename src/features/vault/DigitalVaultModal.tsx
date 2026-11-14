import { useEffect, useState } from 'react'
import {
  X,
  ShieldCheck,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c0e13] rounded-2xl p-5 sm:p-6 border border-white/[0.1] shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[#181c25] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
          aria-label="Close vault"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#181c25] border border-white/[0.1] flex items-center justify-center text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 id="vault-title" className="font-space text-lg font-semibold text-[#ededed]">
              Digital vault
            </h2>
            <p className="text-xs text-[#9499a6] font-sans">
              Download high-resolution master asset files for your verified editions
            </p>
          </div>
        </div>

        {/* Active Signed Token Alert (if generated) */}
        {activeDownload && (
          <div className="my-4 p-3.5 rounded-xl bg-[#12151c] border border-white/[0.08] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-space font-medium text-xs text-[#ededed] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                Download ready
              </span>
              <span className="text-[10px] font-mono-code text-[#666b7a]">
                Expires: {activeDownload.expiresAt}
              </span>
            </div>
            <p className="text-xs text-[#9499a6] font-sans">
              Signed download link for <strong className="text-white">{activeDownload.filename}</strong> is active.
            </p>
            <div className="pt-1">
              <a
                href={activeDownload.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-semibold active:scale-98 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Save asset package (.zip)</span>
              </a>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-[#9499a6] text-xs font-mono-code">
            Loading digital vault...
          </div>
        ) : entitlements.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-[#12151c] rounded-xl border border-white/[0.06] my-4">
            <Lock className="w-8 h-8 text-[#666b7a] mx-auto" />
            <h3 className="font-space font-medium text-[#ededed] text-sm">
              Vault is empty
            </h3>
            <p className="text-xs text-[#9499a6] max-w-sm mx-auto font-sans leading-relaxed">
              Master asset files unlock automatically once your orders are verified.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
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
                  className="p-3.5 sm:p-4 rounded-xl bg-[#12151c] border border-white/[0.07] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-space font-semibold text-sm text-[#ededed]">
                          {e.productTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono-code text-[9px] uppercase bg-white/[0.05] text-[#9499a6] border border-white/[0.08]">
                          {e.collection}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-code text-[#666b7a] block mt-0.5">
                        {e.sku} • Granted {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono-code text-[#666b7a] tabular-nums">
                        Downloads: <strong className="text-white">{e.downloadCount}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleDownload(e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-semibold active:scale-98 disabled:opacity-40 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isGenerating ? 'Preparing...' : 'Download'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-code text-[#666b7a]">
                    <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[280px]">
                      <FileArchive className="w-3.5 h-3.5 text-white/50" />
                      {e.digitalAssetName}
                    </span>
                    <span className="text-[10px] text-[#34d399] font-medium">
                      Verified asset
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono-code text-[#666b7a]">
          <span>Russian Market Digital Vault</span>
          <span>Authorized collector access</span>
        </div>
      </div>
    </div>
  )
}

export default DigitalVaultModal
