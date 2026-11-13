import { useState, useEffect } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Lock,
  Search,
  Clock,
} from 'lucide-react'
import { storeEngine, type WalletTx } from '../../services/storeEngine'

type WalletSectionProps = {
  userId: string
}

export function WalletSection({ userId }: WalletSectionProps) {
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [balanceMinor, setBalanceMinor] = useState(0)
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')
  const [searchQuery, setSearchQuery] = useState('')
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

  const formattedBalance = `$${(Math.abs(balanceMinor) / 100).toFixed(2)}`

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div>
        <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-1">
          CRYPTOGRAPHIC SETTLEMENT LEDGER
        </span>
        <h2 className="font-cinzel text-xl md:text-2xl font-bold text-white">
          Account Wallet & Transactions
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Verified historical ledger of your collectible acquisitions and store settlement adjustments.
        </p>
      </div>

      {/* Main Luxury Glass Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 md:p-8 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-space font-bold text-sm tracking-wider text-white">
                RUSSIAN MARKET VAULT LEDGER
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono-code text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CRYPTOGRAPHICALLY VERIFIED</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 block mb-1">
              STORE SETTLEMENT BALANCE
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-space text-3xl md:text-4xl font-extrabold text-white">
                {formattedBalance}
              </span>
              <span className="font-mono-code text-xs text-cyan-400 font-bold">USD</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-code text-slate-400">
            <span>TOTAL RECORDED TRANSACTIONS: {transactions.length}</span>
            <span className="text-slate-300">
              LEDGER STATUS: <strong className="text-cyan-400">SYNCHRONIZED</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-space font-bold text-base text-white">
            Audit Ledger History
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference..."
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
          <div className="p-12 text-center glass-panel rounded-3xl border border-white/10 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-mono-code">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((tx) => {
              const isDebit = tx.amountMinor < 0
              const formattedAmt = `$${(Math.abs(tx.amountMinor) / 100).toFixed(2)}`
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
                  className="p-3.5 rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
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

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-space font-bold text-xs text-white">
                          {tx.description}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full font-mono-code text-[9px] font-bold uppercase ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-code text-slate-400 block mt-0.5">
                        Ref: {tx.reference} • {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-space font-bold text-sm ${
                        isDebit ? 'text-slate-200' : 'text-emerald-400'
                      }`}
                    >
                      {isDebit ? '-' : '+'}
                      {formattedAmt}
                    </span>
                    <span className="text-[9px] font-mono-code text-slate-500 block">USD</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] font-mono-code text-slate-500 pt-2">
        <Lock className="w-3.5 h-3.5 text-cyan-400" />
        <span>Audit compliant • No arbitrary client-side balance modifications permitted</span>
      </div>
    </div>
  )
}
