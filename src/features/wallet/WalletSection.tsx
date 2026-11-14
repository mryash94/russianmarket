import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Clock,
  Plus,
  RefreshCw,
  QrCode,
} from 'lucide-react'
import { formatINR } from '../../lib/currency'
import { storeEngine, type WalletTx } from '../../services/storeEngine'
import { AddMoneyModal } from './AddMoneyModal'

type WalletSectionProps = {
  userId: string
  userEmail?: string
}

export function WalletSection({ userId, userEmail = 'collector@russianmarket.store' }: WalletSectionProps) {
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [balanceMinor, setBalanceMinor] = useState(0)
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)

  const loadWalletData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [txs, balance] = await Promise.all([
        storeEngine.getWalletTransactions(userId),
        storeEngine.getWalletBalance(userId),
      ])
      setTransactions(txs)
      setBalanceMinor(balance)
    } catch (err) {
      console.error('Failed to load wallet data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadWalletData()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (
        event === 'wallet_updated' ||
        event === 'order_updated' ||
        event === 'deposits_updated'
      ) {
        void loadWalletData()
      }
    })
    return () => unsubscribe()
  }, [loadWalletData])

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filterType === 'all' || tx.transactionType === filterType
    const matchesSearch =
      searchQuery.trim() === '' ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.utrNumber && tx.utrNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  // Financial totals
  const totalCreditsMinor = transactions
    .filter((tx) => tx.transactionType === 'credit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0)

  const totalDebitsMinor = transactions
    .filter((tx) => tx.transactionType === 'debit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0)

  const pendingDepositsCount = transactions.filter((tx) => tx.status === 'pending').length

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-space text-xl md:text-2xl font-semibold text-[#ededed] tracking-tight">
            Store wallet & balance
          </h2>
          <p className="text-xs text-[#9499a6] font-sans mt-0.5">
            Your authenticated balance for instant checkout, deposits, and settlement history
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddMoneyOpen(true)}
          className="self-start sm:self-auto h-10 px-4 rounded-lg btn-primary text-xs font-semibold flex items-center gap-2 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add money</span>
        </button>
      </div>

      {/* 2. Main Premium Wallet Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0c0e13] p-5 sm:p-7 border border-white/[0.08] shadow-xl">
        <div className="relative z-10 space-y-6">
          {/* Top Brand & Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#181c25] border border-white/[0.1] flex items-center justify-center text-white">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-space font-medium text-xs sm:text-sm text-[#ededed] block">
                  Russian Market Sovereign Wallet
                </span>
                <span className="font-mono-code text-[10px] text-[#666b7a]">
                  Account: {userId.slice(0, 14)}...
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-white/80 font-mono-code text-[10px] font-medium">
              <span className="status-beacon active mr-1" />
              <span>Active ledger</span>
            </div>
          </div>

          {/* Current Balance Display */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-sans text-[#9499a6] block mb-1">
                Available balance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-3xl sm:text-4xl md:text-5xl font-bold text-[#ededed] tracking-tight tabular-nums">
                  {formatINR(balanceMinor)}
                </span>
                <span className="font-mono-code text-xs text-[#666b7a]">INR</span>
              </div>
            </div>

            {/* Quick Add Money Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddMoneyOpen(true)}
                className="h-10 px-4 rounded-lg btn-ghost text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>UPI QR Deposit</span>
              </button>
            </div>
          </div>

          {/* Ledger Financial Summary Strip */}
          <div className="pt-4 border-t border-white/[0.07] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono-code">
            <div className="p-2.5 rounded-lg bg-[#12151c] border border-white/[0.06]">
              <span className="text-[#666b7a] text-[10px] block">TOTAL CREDITS:</span>
              <span className="text-[#34d399] font-medium text-xs mt-0.5 block tabular-nums">
                +{formatINR(totalCreditsMinor)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#12151c] border border-white/[0.06]">
              <span className="text-[#666b7a] text-[10px] block">TOTAL ACQUISITIONS:</span>
              <span className="text-white/80 font-medium text-xs mt-0.5 block tabular-nums">
                -{formatINR(totalDebitsMinor)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#12151c] border border-white/[0.06] col-span-2 sm:col-span-1">
              <span className="text-[#666b7a] text-[10px] block">PENDING AUDIT:</span>
              <span
                className={`font-medium text-xs mt-0.5 block tabular-nums ${
                  pendingDepositsCount > 0 ? 'text-[#fbbf24]' : 'text-[#666b7a]'
                }`}
              >
                {pendingDepositsCount} request{pendingDepositsCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transaction History Section */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-space font-semibold text-sm sm:text-base text-[#ededed]">
              Ledger transactions
            </h3>
            <span className="text-[11px] font-mono-code text-[#666b7a] tabular-nums">
              Showing {filtered.length} of {transactions.length} operations
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference..."
                className="w-full h-9 bg-[#181c25] border border-white/[0.08] focus:border-white/30 pl-8 pr-3 py-1 rounded-lg text-xs text-white placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#12151c] p-1 rounded-lg border border-white/[0.08]">
              {(['all', 'credit', 'debit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded font-mono-code text-[10px] font-medium transition-colors ${
                    filterType === t
                      ? 'bg-[#181c25] text-white border border-white/20'
                      : 'text-[#9499a6] hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'credit' ? 'Credits (+)' : 'Debits (-)'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadWalletData()}
              className="p-2 rounded-lg bg-[#181c25] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
              title="Refresh wallet transactions"
              aria-label="Refresh transactions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-[#0c0e13] rounded-xl border border-white/[0.07] space-y-2">
            <Clock className="w-8 h-8 text-[#666b7a] mx-auto" />
            <p className="text-xs text-[#ededed] font-medium">No transactions match your query</p>
            <p className="text-[11px] text-[#9499a6] font-sans">
              Deposit funds via UPI QR or acquire collectibles to generate ledger entries.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-[#0c0e13] border border-white/[0.07] divide-y divide-white/[0.06] overflow-hidden">
            {filtered.map((tx) => {
              const isCredit = tx.transactionType === 'credit'
              const isPending = tx.status === 'pending'
              const isFailed = tx.status === 'failed'

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#12151c]/60 transition-colors"
                >
                  {/* Left: Direction Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        isCredit
                          ? 'bg-white/[0.04] text-[#34d399] border-white/[0.08]'
                          : 'bg-white/[0.04] text-white/70 border-white/[0.08]'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-space font-medium text-xs sm:text-sm text-[#ededed] truncate">
                          {tx.description}
                        </span>
                        {tx.utrNumber && (
                          <span className="px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-[9px] font-mono-code text-[#9499a6] tabular-nums">
                            UTR: {tx.utrNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono-code text-[#666b7a]">
                        <span>Ref: #{tx.reference}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Status Badge */}
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-space font-semibold text-xs sm:text-sm block tabular-nums ${
                        isCredit ? 'text-[#34d399]' : 'text-[#ededed]'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{formatINR(Math.abs(tx.amountMinor))}
                    </span>

                    <span
                      className={`inline-block text-[9px] font-mono-code px-2 py-0.5 rounded uppercase mt-0.5 ${
                        isPending
                          ? 'bg-amber-500/10 text-[#fbbf24] border border-amber-500/20'
                          : isFailed
                          ? 'bg-rose-500/10 text-[#f87171] border border-rose-500/20'
                          : 'bg-white/[0.05] text-[#9499a6] border border-white/[0.08]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Add Money UPI QR Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        userId={userId}
        userEmail={userEmail}
        onDepositSuccess={() => {
          void loadWalletData()
        }}
      />
    </div>
  )
}

export default WalletSection
