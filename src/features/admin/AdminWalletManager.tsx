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
          <h2 className="font-space text-base font-semibold text-[#ededed] tracking-tight">
            Store wallet & UPI payment audit
          </h2>
          <p className="text-xs text-[#9499a6] font-sans mt-0.5">
            Audit and approve UPI add-money requests, review UTR reference numbers, and manage platform balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadData()}
          className="self-start sm:self-auto h-8 px-3 rounded-lg bg-[#181c25] hover:bg-[#202530] text-[#9499a6] hover:text-[#ededed] text-xs font-mono-code flex items-center gap-1.5 transition-colors border border-white/[0.08]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh data</span>
        </button>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0c0e13] border border-white/[0.07] space-y-1">
          <span className="text-[11px] font-mono-code text-[#9499a6] block">
            Platform wallet balances
          </span>
          <span className="font-space text-xl font-semibold text-[#ededed] tabular-nums block">
            {formatINR(totalPlatformBalanceMinor)}
          </span>
          <span className="text-[10px] font-mono-code text-[#666b7a]">
            Across {userBalances.length} active collector accounts
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0c0e13] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code text-[#9499a6] block">
              Pending UPI audits
            </span>
            <span className={`status-beacon ${pendingDeposits.length > 0 ? 'pending' : 'idle'}`} />
          </div>
          <span
            className={`font-space text-xl font-semibold tabular-nums block ${
              pendingDeposits.length > 0 ? 'text-amber-400' : 'text-[#666b7a]'
            }`}
          >
            {pendingDeposits.length}
          </span>
          <span className="text-[10px] font-mono-code text-[#666b7a]">
            Awaiting admin statement match
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0c0e13] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code text-[#9499a6] block">
              Total approved deposits
            </span>
            <span className="status-beacon active" />
          </div>
          <span className="font-space text-xl font-semibold text-emerald-400 tabular-nums block">
            {formatINR(approvedDepositsTotalMinor)}
          </span>
          <span className="text-[10px] font-mono-code text-[#666b7a]">
            Verified server & ledger credit
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0c0e13] border border-white/[0.07] space-y-1">
          <span className="text-[11px] font-mono-code text-[#9499a6] block">
            Total ledger transactions
          </span>
          <span className="font-space text-xl font-semibold text-[#ededed] tabular-nums block">
            {transactions.length}
          </span>
          <span className="text-[10px] font-mono-code text-[#666b7a]">
            Deposits, acquisitions & credits
          </span>
        </div>
      </div>

      {/* 3. Add-Money UPI Audit Requests Queue */}
      <div className="rounded-2xl bg-[#0c0e13] border border-white/[0.07] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-space font-medium text-sm text-[#ededed]">
                Add-money verification queue
              </h3>
              {pendingDeposits.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {pendingDeposits.length} action needed
                </span>
              )}
            </div>
            <p className="text-xs text-[#9499a6] font-sans mt-0.5">
              Review user-submitted UPI UTR reference codes against your bank merchant statement.
            </p>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9499a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search UTR or user..."
                className="w-full h-8 bg-[#12151c] border border-white/[0.08] focus:border-white/20 pl-8 pr-3 py-1 rounded-lg text-xs text-[#ededed] placeholder:text-[#666b7a] outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#12151c] p-0.5 rounded-lg border border-white/[0.06]">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded font-mono-code text-[10px] font-medium transition-colors capitalize ${
                    filter === tab
                      ? 'bg-[#181c25] text-white border border-white/[0.1]'
                      : 'text-[#9499a6] hover:text-[#ededed]'
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
          <div className="p-8 text-center text-[#666b7a] space-y-1 rounded-xl bg-[#12151c] border border-white/[0.05]">
            <CheckCircle2 className="w-6 h-6 text-emerald-500/30 mx-auto" />
            <p className="text-xs font-mono-code">No {filter} deposit requests in queue.</p>
          </div>
        ) : (
          <div className="space-y-2">
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
                  className="p-3.5 rounded-xl bg-[#12151c] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-space font-medium text-base text-[#ededed] tabular-nums">
                        {formattedAmt}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          dep.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : dep.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {dep.status}
                      </span>

                      <span className="text-[11px] font-mono-code text-[#9499a6]">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono-code text-[#9499a6] flex-wrap">
                      <span>User: <strong className="text-[#ededed]">{dep.userEmail}</strong></span>
                      <span>•</span>
                      <span>Ref: {dep.reference}</span>
                    </div>

                    {/* UTR Pill with Copy Action */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono-code text-[#9499a6]">
                        UTR:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(dep.utrNumber, dep.id)}
                        className="px-2 py-0.5 rounded bg-[#181c25] border border-white/[0.08] text-[#ededed] font-mono-code text-xs flex items-center gap-1.5 hover:bg-[#202530] transition-colors"
                        title="Copy UTR number"
                      >
                        <span>{dep.utrNumber}</span>
                        {copiedId === dep.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#9499a6]" />
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
                    <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(dep)}
                        className="btn-primary h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & credit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setRejectingRequest(dep)}
                        className="h-8 px-2.5 rounded-lg bg-white/[0.03] hover:bg-rose-500/10 text-[#666b7a] hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/20 text-xs font-mono-code transition-colors flex items-center gap-1"
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
      <div className="rounded-2xl bg-[#0c0e13] border border-white/[0.07] p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-space font-medium text-sm text-[#ededed]">
            Collector wallet balances
          </h3>
          <p className="text-xs text-[#9499a6] font-sans mt-0.5">
            Active balances maintained in the Russian Market database ledger.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#9499a6]">
                <th className="pb-2.5 font-medium">Collector account</th>
                <th className="pb-2.5 font-medium">Available balance</th>
                <th className="pb-2.5 font-medium text-center">Operations</th>
                <th className="pb-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {userBalances.map((u) => (
                <tr key={u.userId} className="hover:bg-white/[0.02]">
                  <td className="py-3 text-[#ededed] font-medium">
                    {u.userId}
                  </td>
                  <td className="py-3 font-space font-medium text-sm text-[#ededed] tabular-nums">
                    {formatINR(u.balanceMinor)}
                  </td>
                  <td className="py-3 text-center text-[#9499a6] tabular-nums">
                    {u.txCount} txs
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c0e13] p-6 border border-white/[0.1] shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setApprovingRequest(null)}
              className="absolute right-4 top-4 p-1.5 rounded-md bg-[#181c25] text-[#9499a6] hover:text-[#ededed] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono-code text-[11px] uppercase tracking-wider text-emerald-400 block mb-1">
                Audit verification & settlement
              </span>
              <h3 className="font-space text-base font-semibold text-[#ededed]">
                Approve deposit #{approvingRequest.reference}
              </h3>
              <p className="text-xs text-[#9499a6] font-sans mt-0.5">
                Credit <strong className="text-emerald-400 font-medium tabular-nums">{formatINR(approvingRequest.amountMinor)}</strong> to <span className="text-[#ededed]">{approvingRequest.userEmail}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#12151c] border border-white/[0.06] text-xs space-y-1">
              <p className="text-[#9499a6] font-sans">
                Bank UTR: <strong className="font-mono-code text-[#ededed]">{approvingRequest.utrNumber}</strong>
              </p>
              <p className="text-[11px] text-[#666b7a] font-sans">
                Confirming will immediately credit the collector's available balance and append an audit ledger entry.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono-code">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="h-9 rounded-lg bg-[#181c25] hover:bg-[#202530] text-[#9499a6] hover:text-[#ededed] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmApprove}
                className="btn-primary h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & credit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c0e13] p-6 border border-white/[0.1] shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setRejectingRequest(null)}
              className="absolute right-4 top-4 p-1.5 rounded-md bg-[#181c25] text-[#9499a6] hover:text-[#ededed] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono-code text-[11px] uppercase tracking-wider text-rose-400 block mb-1">
                Audit rejection
              </span>
              <h3 className="font-space text-base font-semibold text-[#ededed]">
                Reject deposit #{rejectingRequest.reference}
              </h3>
              <p className="text-xs text-[#9499a6] font-sans mt-0.5">
                Amount: {formatINR(rejectingRequest.amountMinor)} • UTR: {rejectingRequest.utrNumber}
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs font-mono-code">
              <div>
                <label className="block text-[#9499a6] mb-1">Reason for rejection *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#12151c] border border-white/[0.08] focus:border-rose-400/40 p-3 rounded-lg text-xs font-sans text-[#ededed] placeholder:text-[#666b7a] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="h-9 rounded-lg bg-[#181c25] hover:bg-[#202530] text-[#9499a6] hover:text-[#ededed] text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="h-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  Confirm rejection
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
