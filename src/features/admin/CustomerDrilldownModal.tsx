import { useState, useEffect } from 'react'
import {
  X,
  User,
  ShieldCheck,
  Crown,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  SlidersHorizontal,
  MessageCircle,
} from 'lucide-react'
import { storeEngine, type WalletTx, type SupportConversation } from '../../services/storeEngine'
import { formatINR } from '../../lib/currency'
import type { CustomerCRMRecord } from '../../lib/exportUtils'

interface CustomerDrilldownModalProps {
  isOpen: boolean
  customer: CustomerCRMRecord | null
  onClose: () => void
  onOpenChatWithCustomer?: (userEmail: string) => void
  onNotify: (msg: string) => void
  onRefreshData: () => void
}

export function CustomerDrilldownModal({
  isOpen,
  customer,
  onClose,
  onOpenChatWithCustomer,
  onNotify,
  onRefreshData,
}: CustomerDrilldownModalProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'wallet' | 'chat'>('orders')
  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([])
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [currentBalance, setCurrentBalance] = useState<number>(0)

  // Balance adjustment modal / state
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit')
  const [adjustRupees, setAdjustRupees] = useState<string>('')
  const [adjustReason, setAdjustReason] = useState<string>('')
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false)

  useEffect(() => {
    if (!isOpen || !customer) return
    setCurrentBalance(customer.walletBalanceMinor)

    const loadData = async () => {
      try {
        const [txs, convs, bal] = await Promise.all([
          storeEngine.getWalletTransactions(customer.userId),
          storeEngine.getConversations(customer.userId),
          storeEngine.getWalletBalance(customer.userId),
        ])
        setWalletTxs(txs)
        setConversations(convs)
        setCurrentBalance(bal)
      } catch (err) {
        console.error('Failed to load customer dossier data:', err)
      }
    }

    void loadData()
  }, [isOpen, customer])

  if (!isOpen || !customer) return null

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const rupees = parseFloat(adjustRupees)
    if (isNaN(rupees) || rupees <= 0) {
      onNotify('Please enter a valid rupee amount.')
      return
    }
    if (!adjustReason.trim()) {
      onNotify('Mandatory reason required for administrative audit logging.')
      return
    }

    const paise = Math.round(rupees * 100)
    const amountMinor = adjustType === 'credit' ? paise : -paise

    setIsSubmittingAdjust(true)
    try {
      const res = await storeEngine.adjustWalletBalance({
        userId: customer.userId,
        amountMinor,
        reason: adjustReason.trim(),
        adminEmail: 'root@russianmarket.store',
      })
      if (res.success) {
        setCurrentBalance(res.newBalanceMinor)
        setShowAdjustModal(false)
        setAdjustRupees('')
        setAdjustReason('')
        onNotify(`Wallet adjusted by ${adjustType === 'credit' ? '+' : '-'}${formatINR(paise)}.`)
        const updatedTxs = await storeEngine.getWalletTransactions(customer.userId)
        setWalletTxs(updatedTxs)
        onRefreshData()
      }
    } catch (err) {
      console.error('Wallet adjustment error:', err)
      onNotify('Failed to execute balance adjustment.')
    } finally {
      setIsSubmittingAdjust(false)
    }
  }

  const avgOrderMinor =
    customer.orders.length > 0
      ? Math.round(customer.totalSpentMinor / customer.orders.length)
      : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0a0c10] rounded-2xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-cyan-400">
              {customer.tier === 'VIP Sovereign' ? (
                <Crown className="w-6 h-6 text-amber-400" />
              ) : (
                <User className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{customer.email}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                    customer.tier === 'VIP Sovereign'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : customer.tier === 'Verified Collector'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-white/50 border border-white/10'
                  }`}
                >
                  {customer.tier}
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono mt-0.5">
                Collector ID: <span className="text-white/80">{customer.userId}</span> • Active since{' '}
                {new Date(customer.firstSeen).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* LTV */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono">
              <span>LIFETIME SPEND</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {formatINR(customer.totalSpentMinor)}
            </div>
            <p className="text-[10px] text-white/40 font-mono">
              {customer.orders.length} orders • Avg: {formatINR(avgOrderMinor)}
            </p>
          </div>

          {/* Current Wallet */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono">
              <span>LIVE WALLET BALANCE</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {formatINR(currentBalance)}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-white/40 font-mono">
                {walletTxs.length} ledger entries
              </span>
              <button
                type="button"
                onClick={() => setShowAdjustModal(true)}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono flex items-center gap-1 transition-colors"
              >
                <SlidersHorizontal className="w-2.5 h-2.5 text-cyan-400" />
                <span>Adjust</span>
              </button>
            </div>
          </div>

          {/* Concierge Link */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono">
              <span>CONCIERGE DESK</span>
              <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {conversations.length} Threads
            </div>
            <div className="pt-1">
              {onOpenChatWithCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenChatWithCustomer(customer.email)
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 underline underline-offset-2"
                >
                  <span>Open Concierge Chat</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Acquisitions ({customer.orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'wallet'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet Ledger ({walletTxs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Support History ({conversations.length})</span>
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40 font-mono bg-white/[0.02] rounded-xl border border-white/5">
                No acquisitions logged for this collector.
              </div>
            ) : (
              <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                {customer.orders.map((o) => (
                  <div key={o.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{o.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                            o.status === 'payment_verified' || o.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {o.status}
                        </span>
                        <span className="text-[10px] text-white/40">{o.paymentMethod}</span>
                      </div>
                      <div className="text-[11px] text-white/70">
                        {o.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-emerald-400 font-bold block">{formatINR(o.subtotalMinor)}</span>
                      <span className="text-[10px] text-white/40">
                        {o.status === 'payment_verified' || o.status === 'completed'
                          ? 'Verified & Delivered'
                          : 'Awaiting Audit'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Wallet Ledger */}
        {activeTab === 'wallet' && (
          <div className="space-y-3">
            {walletTxs.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40 font-mono bg-white/[0.02] rounded-xl border border-white/5">
                No wallet transactions recorded.
              </div>
            ) : (
              <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                {walletTxs.map((tx) => (
                  <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{tx.description}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-white/60 uppercase">
                          {tx.transactionType}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/40">
                        Ref: {tx.reference || 'N/A'} {tx.utrNumber ? `• UTR: ${tx.utrNumber}` : ''} •{' '}
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold block ${
                          tx.amountMinor > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.amountMinor > 0 ? '+' : ''}
                        {formatINR(tx.amountMinor)}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase">{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Chat Conversations */}
        {activeTab === 'chat' && (
          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40 font-mono bg-white/[0.02] rounded-xl border border-white/5">
                No concierge conversations found for this user.
              </div>
            ) : (
              <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                {conversations.map((c) => (
                  <div key={c.id} className="p-3.5 space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{c.subject}</span>
                      <span
                        className={`text-[10px] uppercase font-semibold ${
                          c.status === 'closed' ? 'text-white/40' : 'text-emerald-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="text-white/60 text-[11px] truncate">
                      {c.messages.length > 0
                        ? c.messages[c.messages.length - 1].body
                        : 'No messages yet'}
                    </div>
                    {c.internalNotes && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                        <span className="font-bold">Staff Note:</span> {c.internalNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Inline Balance Adjuster */}
        {showAdjustModal && (
          <div className="p-4 rounded-xl bg-[#12151c] border border-cyan-500/30 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Administrative Wallet Balance Adjustment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-white/40 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs font-mono">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    adjustType === 'credit'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                >
                  + Credit Funds
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    adjustType === 'debit'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                >
                  - Debit Funds
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-white/70 block text-[11px]">Amount (₹ INR)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={adjustRupees}
                    onChange={(e) => setAdjustRupees(e.target.value)}
                    placeholder="e.g. 500"
                    required
                    className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 block text-[11px]">Audit Reason (Required)</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. VIP Concierge bonus / Dispute credit"
                    required
                    className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-white/40">
                  Adjustment logs an immutable admin audit record and emits realtime update.
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Processing...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
