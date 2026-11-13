import { useState, useEffect } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Lock,
  Search,
  Clock,
  Sparkles,
} from 'lucide-react'
import { RussianMarketCard } from '../../components/RussianMarketCard'
import { formatINR } from '../../lib/currency'
import { storeEngine, type WalletTx } from '../../services/storeEngine'

type WalletSectionProps = {
  userId: string
}

export function WalletSection({ userId }: WalletSectionProps) {
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [balanceMinor, setBalanceMinor] = useState(0)
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cardView, setCardView] = useState<'balance' | 'holo'>('balance')
  const [, setLoading] = useState(true)

  useEffect(() => {
    const loadWalletData = async () => {
      setLoading(true)
      const [txs, balance] = await Promise.all([
        storeEngine.getWalletTransactions(userId),
        storeEngine.getWalletBalance(userId),
      ])
      setTransactions(txs)
      setBalanceMinor(balance)
      setLoading(false)
    }
    loadWalletData()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'wallet_updated' || event === 'order_updated') {
        loadWalletData()
      }
    })
    return () => unsubscribe()
  }, [userId])

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filterType === 'all' || tx.transactionType === filterType
    const matchesSearch =
      searchQuery.trim() === '' ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formattedBalance = formatINR(Math.abs(balanceMinor))

  return (
    <div className="space-y-5 pb-16 max-w-4xl mx-auto">
      <div>
        <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-1">
          STORE WALLET
        </span>
        <h2 className="font-cinzel text-xl md:text-2xl font-bold text-white">
          Wallet & Transactions
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          History of your collectible purchases and account balance.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.05] border border-white/[0.08] w-fit">
        <button
          type="button"
          onClick={() => setCardView('balance')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-code font-semibold transition-all ${
            cardView === 'balance'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Balance Ledger</span>
        </button>
        <button
          type="button"
          onClick={() => setCardView('holo')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-code font-semibold transition-all ${
            cardView === 'holo'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D Sovereign Pass</span>
        </button>
      </div>

      {/* Main Luxury Card Display */}
      {cardView === 'balance' ? (
        <div className="relative overflow-hidden rounded-3xl glass-panel-elevated p-5 sm:p-7 border border-white/15 shadow-2xl">
          <div className="relative z-10 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="font-space font-bold text-xs sm:text-sm tracking-wider text-white">
                  RUSSIAN MARKET WALLET
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono-code text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>VERIFIED</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 block mb-1">
                CURRENT BALANCE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-3xl md:text-4xl font-extrabold text-white">
                  {formattedBalance}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code text-slate-400">
              <span>TRANSACTIONS: {transactions.length}</span>
              <span className="text-slate-300">
                STATUS: <strong className="text-cyan-400">ACTIVE</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl glass-panel-elevated border border-white/15 shadow-2xl space-y-3">
          <div className="w-full max-w-[360px] mx-auto">
            <RussianMarketCard
              category="VISA"
              holder="RUSSIAN MARKET VIP"
              name="Haute Sovereign Pass"
              interactive={true}
              showFlipHint={true}
            />
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="font-space font-bold text-sm sm:text-base text-white">
            Transaction History
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full glass-input pl-8 pr-3 py-1 rounded-xl text-xs placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {(['all', 'debit', 'credit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg font-mono-code text-[10px] font-bold uppercase transition-all ${
                    filterType === t
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 space-y-1.5">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-mono-code">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => {
              const isDebit = tx.amountMinor < 0
              const formattedAmt = formatINR(Math.abs(tx.amountMinor))
              const formattedDate = new Date(tx.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })

              return (
                <div
                  key={tx.id}
                  className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDebit
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isDebit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-space font-bold text-xs text-white truncate">
                          {tx.description}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full font-mono-code text-[9px] font-bold uppercase ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-code text-slate-400 block mt-0.5 truncate">
                        {tx.reference} • {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-space font-bold text-xs sm:text-sm ${
                        isDebit ? 'text-slate-200' : 'text-emerald-400'
                      }`}
                    >
                      {isDebit ? '-' : '+'}
                      {formattedAmt}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] font-mono-code text-slate-500 pt-1">
        <Lock className="w-3 h-3 text-cyan-400" />
        <span>Verified database transactions</span>
      </div>
    </div>
  )
}
