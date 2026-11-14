import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  XCircle,
  Search,
  Copy,
  Check,
  RefreshCw,
  X,
} from 'lucide-react'
import {
  storeEngine,
  type DepositRequest,
  type WalletTx,
} from '../../services/storeEngine'
import { formatINR } from '../../lib/currency'

type AdminWalletManagerProps = {
  onNotify: (msg: string) => void
}

export function AdminWalletManager({ onNotify }: AdminWalletManagerProps) {
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [userBalances, setUserBalances] = useState<{ userId: string; balanceMinor: number; txCount: number }[]>([])
  const [filter, setFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rejection modal state
  const [rejectingRequest, setRejectingRequest] = useState<DepositRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('Payment reference / UTR not found on bank statement')
  // Approval modal state
  const [approvingRequest, setApprovingRequest] = useState<DepositRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const reloadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [depList, txList, balList] = await Promise.all([
        storeEngine.getDepositRequests(),
        storeEngine.getWalletTransactions(),
        storeEngine.getAllWalletBalances(),
      ])
      setDeposits(depList)
      setTransactions(txList)
      setUserBalances(balList)
    } catch (err) {
      console.error('Failed to load admin wallet data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadData()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (
        event === 'deposits_updated' ||
        event === 'wallet_updated' ||
        event === 'order_updated'
      ) {
        void reloadData()
      }
    })
    return () => unsubscribe()
  }, [reloadData])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleApprove = (dep: DepositRequest) => {
    setApprovingRequest(dep)
  }

  const handleConfirmApprove = async () => {
    if (!approvingRequest) return

    setIsProcessing(true)
    try {
      await storeEngine.approveDepositRequest(approvingRequest.id, 'Administrator')
      onNotify(`Deposit #${approvingRequest.reference} verified! ${formatINR(approvingRequest.amountMinor)} credited to ${approvingRequest.userEmail}`)
      setApprovingRequest(null)
      await reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingRequest) return

    setIsProcessing(true)
    try {
      await storeEngine.rejectDepositRequest(rejectingRequest.id, 'Administrator', rejectReason)
      onNotify(`Deposit #${rejectingRequest.reference} rejected and audit record logged.`)
      setRejectingRequest(null)
      await reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // Filtered deposits
  const filteredDeposits = deposits.filter((d) => {
    const matchesFilter = filter === 'all' ? true : d.status === filter
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      d.userEmail.toLowerCase().includes(q) ||
      d.userId.toLowerCase().includes(q) ||
      d.reference.toLowerCase().includes(q) ||
      d.utrNumber.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  // Metrics
  const pendingDeposits = deposits.filter((d) => d.status === 'pending')
  const approvedDepositsTotalMinor = deposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + d.amountMinor, 0)
  const totalPlatformBalanceMinor = userBalances.reduce((sum, u) => sum + u.balanceMinor, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-space text-xl font-bold text-white tracking-tight">
            Store Wallet & UPI Payment Audit
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Audit and approve UPI add-money requests, review UTR reference numbers, and manage platform balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadData()}
          className="self-start sm:self-auto h-9 px-3 rounded-xl glass-panel hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-mono-code flex items-center gap-1.5 transition-colors border border-white/[0.08]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] space-y-1">
          <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
            Platform Wallet Balances
          </span>
          <span className="font-space text-xl sm:text-2xl font-extrabold text-cyan-400 block">
            {formatINR(totalPlatformBalanceMinor)}
          </span>
          <span className="text-[10px] font-mono-code text-slate-500">
            Across {userBalances.length} active collector accounts
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] space-y-1">
          <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
            Pending UPI Audits
          </span>
          <span
            className={`font-space text-xl sm:text-2xl font-extrabold block ${
              pendingDeposits.length > 0 ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {pendingDeposits.length}
          </span>
          <span className="text-[10px] font-mono-code text-slate-500">
            Awaiting admin statement match
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] space-y-1">
          <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
            Total Approved Deposits
          </span>
          <span className="font-space text-xl sm:text-2xl font-extrabold text-emerald-400 block">
            {formatINR(approvedDepositsTotalMinor)}
          </span>
          <span className="text-[10px] font-mono-code text-slate-500">
            Verified server & ledger credit
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] space-y-1">
          <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
            Total Ledger Transactions
          </span>
          <span className="font-space text-xl sm:text-2xl font-extrabold text-white block">
            {transactions.length}
          </span>
          <span className="text-[10px] font-mono-code text-slate-500">
            Deposits, acquisitions & credits
          </span>
        </div>
      </div>

      {/* 3. Add-Money UPI Audit Requests Queue */}
      <div className="rounded-3xl glass-panel-elevated border border-white/[0.12] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-space font-bold text-base text-white">
                Add-Money Verification Queue
              </h3>
              {pendingDeposits.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono-code text-[10px] font-bold border border-amber-400/40">
                  {pendingDeposits.length} Action Needed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Review user-submitted UPI UTR reference codes against your bank merchant statement.
            </p>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search UTR or user..."
                className="w-full h-9 glass-input pl-8 pr-3 py-1 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg font-mono-code text-[10px] font-bold uppercase transition-all ${
                    filter === tab
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredDeposits.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-1 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
            <p className="text-xs font-mono-code">No {filter} deposit requests in queue.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDeposits.map((dep) => {
              const formattedAmt = formatINR(dep.amountMinor)
              const formattedDate = new Date(dep.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={dep.id}
                  className="p-4 rounded-2xl glass-panel border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-space font-extrabold text-base text-white">
                        {formattedAmt}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full font-mono-code text-[9px] font-bold uppercase border ${
                          dep.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                            : dep.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                        }`}
                      >
                        {dep.status}
                      </span>

                      <span className="text-[10px] font-mono-code text-slate-400">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono-code text-slate-300 flex-wrap">
                      <span>USER: <strong>{dep.userEmail}</strong></span>
                      <span>•</span>
                      <span>REF: {dep.reference}</span>
                    </div>

                    {/* UTR Pill with Copy Action */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono-code text-slate-400">
                        SUBMITTED UPI UTR:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(dep.utrNumber, dep.id)}
                        className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono-code font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-500/25 transition-all"
                        title="Copy UTR number"
                      >
                        <span>{dep.utrNumber}</span>
                        {copiedId === dep.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {dep.rejectionReason && (
                      <span className="text-[11px] font-mono-code text-rose-400 block">
                        Reason: {dep.rejectionReason} (by {dep.reviewedBy})
                      </span>
                    )}
                  </div>

                  {/* Actions for Pending Requests */}
                  {dep.status === 'pending' && (
                    <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(dep)}
                        className="h-9 px-3.5 rounded-xl btn-primary text-black font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        <span>Approve & Credit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setRejectingRequest(dep)}
                        className="h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-xs font-mono-code transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Platform User Balances Summary */}
      <div className="rounded-3xl glass-panel-elevated border border-white/[0.12] p-5 sm:p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-space font-bold text-base text-white">
            Collector Wallet Balances
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Active balances maintained in the Russian Market database ledger.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400">
                <th className="pb-2.5 font-medium">COLLECTOR ACCOUNT</th>
                <th className="pb-2.5 font-medium">AVAILABLE BALANCE</th>
                <th className="pb-2.5 font-medium text-center">TOTAL OPERATIONS</th>
                <th className="pb-2.5 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {userBalances.map((u) => (
                <tr key={u.userId} className="hover:bg-white/[0.02]">
                  <td className="py-3 text-white font-medium">
                    {u.userId}
                  </td>
                  <td className="py-3 font-space font-bold text-sm text-cyan-400">
                    {formatINR(u.balanceMinor)}
                  </td>
                  <td className="py-3 text-center text-slate-300">
                    {u.txCount} txs
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono-code text-[9px] font-bold border border-emerald-400/30">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-6 border border-emerald-500/30 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setApprovingRequest(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl glass-input text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                AUDIT VERIFICATION & SETTLEMENT
              </span>
              <h3 className="font-space text-lg font-bold text-white">
                Approve Deposit #{approvingRequest.reference}
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Credit <strong className="text-emerald-400 font-bold">{formatINR(approvingRequest.amountMinor)}</strong> to <span className="text-white">{approvingRequest.userEmail}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
              <p className="text-slate-300 font-sans">
                Bank UTR: <strong className="font-mono-code text-white">{approvingRequest.utrNumber}</strong>
              </p>
              <p className="text-[11px] text-slate-400 font-sans">
                Confirming will immediately credit the collector's available balance and append an audit ledger entry.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono-code">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="h-10 rounded-xl btn-ghost text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmApprove}
                className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Credit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-6 border border-white/[0.14] shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setRejectingRequest(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl glass-input text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-rose-400 block mb-1">
                AUDIT REJECTION
              </span>
              <h3 className="font-space text-lg font-bold text-white">
                Reject Deposit #{rejectingRequest.reference}
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Amount: {formatINR(rejectingRequest.amountMinor)} • UTR: {rejectingRequest.utrNumber}
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs font-mono-code">
              <div>
                <label className="block text-slate-300 mb-1">REASON FOR REJECTION *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full glass-input p-3 rounded-xl text-xs font-sans placeholder:text-slate-500 focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="h-10 rounded-xl btn-ghost text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminWalletManager
