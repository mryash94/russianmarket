import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Lock,
  Search,
  Clock,
  Plus,
  RefreshCw,
  QrCode,
  AlertCircle,
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

  // Totals calculation
  const totalCreditsMinor = transactions
    .filter((tx) => tx.transactionType === 'credit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0)

  const totalDebitsMinor = transactions
    .filter((tx) => tx.transactionType === 'debit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0)

  const pendingDepositsCount = transactions.filter((tx) => tx.status === 'pending').length

  return (
    <div className="space-y-5 pb-16 max-w-4xl mx-auto">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
            SOVEREIGN ASSET LEDGER
          </span>
          <h2 className="font-space text-xl md:text-2xl font-bold text-white tracking-tight">
            Store Wallet & Balance
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Your authenticated balance for instant checkout, deposits, and settlement history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddMoneyOpen(true)}
          className="self-start sm:self-auto h-10 px-4 rounded-xl btn-primary text-xs font-bold flex items-center gap-2 active:scale-95 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>ADD MONEY</span>
        </button>
      </div>

      {/* 2. Main Premium Wallet Balance Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-elevated p-5 sm:p-7 border border-white/[0.14] shadow-2xl">
        <div className="relative z-10 space-y-6">
          {/* Top Brand & Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-space font-bold text-xs sm:text-sm tracking-wider text-white block">
                  RUSSIAN MARKET SOVEREIGN WALLET
                </span>
                <span className="font-mono-code text-[10px] text-slate-400">
                  ACCOUNT ID: {userId.slice(0, 14)}...
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono-code text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACTIVE LEDGER</span>
            </div>
          </div>

          {/* Current Balance Display */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 block mb-1">
                AVAILABLE BALANCE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                  {formatINR(balanceMinor)}
                </span>
                <span className="font-mono-code text-xs text-slate-400 font-medium">INR</span>
              </div>
            </div>

            {/* Quick Add Money Action on Card */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddMoneyOpen(true)}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-95 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>UPI QR Deposit</span>
              </button>
            </div>
          </div>

          {/* Ledger Financial Summary Strip */}
          <div className="pt-4 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono-code">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-slate-400 text-[10px] block">TOTAL CREDITS:</span>
              <span className="text-emerald-400 font-bold text-xs mt-0.5 block">
                +{formatINR(totalCreditsMinor)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-slate-400 text-[10px] block">TOTAL ACQUISITIONS:</span>
              <span className="text-slate-200 font-bold text-xs mt-0.5 block">
                -{formatINR(totalDebitsMinor)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] col-span-2 sm:col-span-1">
              <span className="text-slate-400 text-[10px] block">PENDING AUDIT:</span>
              <span
                className={`font-bold text-xs mt-0.5 block ${
                  pendingDepositsCount > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {pendingDepositsCount} Request{pendingDepositsCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transaction History Section */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-space font-bold text-sm sm:text-base text-white">
              Ledger Transactions
            </h3>
            <span className="text-[11px] font-mono-code text-slate-400">
              Showing {filtered.length} of {transactions.length} recorded operations
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
                className="w-full h-9 glass-input pl-8 pr-3 py-1 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
              {(['all', 'credit', 'debit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg font-mono-code text-[10px] font-bold uppercase transition-all ${
                    filterType === t
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'credit' ? 'Credits (+)' : 'Debits (-)'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadWalletData()}
              className="p-2 rounded-xl glass-input text-slate-400 hover:text-white transition-colors"
              title="Refresh wallet transactions"
              aria-label="Refresh transactions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-white/[0.08] space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-300 font-medium">No transactions match your query.</p>
            <p className="text-[11px] text-slate-500 font-sans">
              Add funds using UPI QR or complete a collectible purchase to update the ledger.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => {
              const isCredit = tx.transactionType === 'credit'
              const formattedAmt = formatINR(Math.abs(tx.amountMinor))
              const formattedDate = new Date(tx.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 rounded-2xl glass-panel hover:glass-panel-elevated border border-white/[0.08] hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-400/30'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-space font-bold text-xs sm:text-sm text-white truncate">
                          {tx.description}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full font-mono-code text-[9px] font-bold uppercase border ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-400/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono-code text-slate-400 truncate">
                        <span>REF: {tx.reference}</span>
                        {tx.utrNumber && <span className="text-cyan-400">UTR: {tx.utrNumber}</span>}
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>

                      {tx.rejectionReason && (
                        <span className="text-[10px] font-mono-code text-rose-400 block mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>Audit note: {tx.rejectionReason}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-space font-extrabold text-sm sm:text-base tabular-nums ${
                        isCredit ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isCredit ? '+' : '-'}
                      {formattedAmt}
                    </span>
                    <span className="block text-[9px] font-mono-code text-slate-500 uppercase">
                      {tx.transactionType}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Security Footer Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-code text-slate-500 pt-2">
        <Lock className="w-3 h-3 text-cyan-400" />
        <span>Cryptographically verified sovereign database ledger</span>
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
