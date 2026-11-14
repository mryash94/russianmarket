import { useState, useEffect, useCallback } from 'react'
import {
  Scale,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  X,
  CreditCard,
  Wallet,
  ShoppingBag,
} from 'lucide-react'
import {
  storeEngine,
  type FinancialReconciliationSnapshot,
  type FinancialDiscrepancy,
} from '../../services/storeEngine'
import { formatINR } from '../../lib/currency'

type AdminReconciliationDashboardProps = {
  onNotify?: (msg: string) => void
}

const SEVERITY_COLORS: Record<FinancialDiscrepancy['severity'], { badge: string; text: string }> = {
  high: { badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', text: 'text-rose-400' },
  medium: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', text: 'text-amber-400' },
  low: { badge: 'bg-white/10 text-white/60 border-white/10', text: 'text-white/60' },
}

export function AdminReconciliationDashboard({ onNotify }: AdminReconciliationDashboardProps) {
  const [snapshots, setSnapshots] = useState<FinancialReconciliationSnapshot[]>([])
  const [activeSnapshot, setActiveSnapshot] = useState<FinancialReconciliationSnapshot | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all')

  // Resolution Modal State
  const [resolvingDiscrepancy, setResolvingDiscrepancy] = useState<{
    discrepancy: FinancialDiscrepancy
  } | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false)

  const loadSnapshots = useCallback(async () => {
    try {
      const history = await storeEngine.getFinancialReconciliationSnapshots()
      setSnapshots(history)
      if (history.length > 0 && !activeSnapshot) {
        setActiveSnapshot(history[0])
      }
    } catch (err) {
      console.error('Failed to load reconciliation snapshots:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeSnapshot])

  useEffect(() => {
    void loadSnapshots()
  }, [loadSnapshots])

  const handleRunAudit = async () => {
    setIsAuditing(true)
    try {
      const newSnapshot = await storeEngine.runFinancialReconciliationAudit()
      setActiveSnapshot(newSnapshot)
      setSnapshots((prev) => [newSnapshot, ...prev])
      const totalDisc = newSnapshot.discrepancies.length
      onNotify?.(
        `Audit completed: ${totalDisc} ${totalDisc === 1 ? 'discrepancy' : 'discrepancies'} flagged`
      )
    } catch (err: any) {
      console.error('Audit run failed:', err)
      onNotify?.(`Audit failed: ${err.message || 'Unknown error'}`)
    } finally {
      setIsAuditing(false)
    }
  }

  const handleOpenResolveModal = (discrepancy: FinancialDiscrepancy) => {
    setResolvingDiscrepancy({ discrepancy })
    setResolutionNotes(discrepancy.resolutionNotes || '')
  }

  const handleConfirmResolve = async () => {
    if (!resolvingDiscrepancy) return
    setIsSubmittingResolution(true)
    try {
      const notes = resolutionNotes.trim() || 'Resolved manually by admin operator.'
      await storeEngine.resolveDiscrepancy(resolvingDiscrepancy.discrepancy.id, notes)
      onNotify?.('Discrepancy marked as resolved with operator audit notes')

      // Update local activeSnapshot state
      setActiveSnapshot((prev) => {
        if (!prev) return null
        const updated = prev.discrepancies.map((d) =>
          d.id === resolvingDiscrepancy.discrepancy.id
            ? { ...d, status: 'resolved' as const, resolutionNotes: notes }
            : d
        )
        return { ...prev, discrepancies: updated }
      })
      setResolvingDiscrepancy(null)
      setResolutionNotes('')
    } catch (err) {
      console.error('Failed to resolve discrepancy:', err)
    } finally {
      setIsSubmittingResolution(false)
    }
  }

  const handleExportReconciliationReport = () => {
    if (!activeSnapshot) return
    const blob = new Blob([JSON.stringify(activeSnapshot, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial_reconciliation_${activeSnapshot.id}_${activeSnapshot.snapshotDate.slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onNotify?.('Reconciliation ledger export downloaded')
  }

  const currentDiscrepancies = activeSnapshot?.discrepancies || []
  const filteredDiscrepancies = currentDiscrepancies.filter((d) => {
    if (filterSeverity !== 'all' && d.severity !== filterSeverity) return false
    const isResolved = d.status === 'resolved'
    if (filterStatus === 'open' && isResolved) return false
    if (filterStatus === 'resolved' && !isResolved) return false
    return true
  })

  const discrepanciesCount = activeSnapshot?.discrepancies.length || 0

  return (
    <div className="space-y-6">
      {/* Header & Run Audit Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0c0e12] border border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400">
              <Scale className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-white tracking-tight">Financial Reconciliation Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              AUDIT ENGINE
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Automated cross-check of Orders, SunPay UPI receipts, bank UTRs & Wallet Ledger transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportReconciliationReport}
            disabled={!activeSnapshot}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-all border border-white/10 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit
          </button>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-cyan-500/10 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? 'Auditing Ledgers...' : 'Run Reconciliation Audit'}
          </button>
        </div>
      </div>

      {/* Snapshot Selector & Timestamp */}
      {snapshots.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-white/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Audit Session:</span>
            <select
              value={activeSnapshot?.id || ''}
              onChange={(e) => {
                const found = snapshots.find((s) => s.id === e.target.value)
                if (found) setActiveSnapshot(found)
              }}
              className="bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.snapshotDate).toLocaleString()} ({s.discrepancies.length} flags)
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-white/40 hidden sm:block">
            Auditor: <strong className="text-white/80">{activeSnapshot?.auditedBy || 'system'}</strong>
          </div>
        </div>
      )}

      {/* KPI Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>Settled Revenue</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {activeSnapshot ? formatINR(activeSnapshot.totalSettledMinor) : '—'}
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            {activeSnapshot?.totalOrdersCount || 0} total orders tracked
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>Wallet Credits</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {activeSnapshot ? formatINR(activeSnapshot.totalWalletCreditsMinor) : '—'}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Deposits verified & loaded</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>Wallet Debits</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {activeSnapshot ? formatINR(activeSnapshot.totalWalletDebitsMinor) : '—'}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Direct wallet checkouts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>Audit Health</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                discrepanciesCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {discrepanciesCount === 0 ? 'CLEAN' : `${discrepanciesCount} FLAGS`}
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            {discrepanciesCount === 0
              ? 'All orders & UTRs balanced'
              : 'Discrepancies require review'}
          </p>
        </div>
      </div>

      {/* Discrepancies Table */}
      <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Audit Discrepancies & Anomalies
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-0.5 text-xs font-mono">
              {(['all', 'open', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    filterStatus === st
                      ? 'bg-cyan-400/20 text-cyan-400 font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-0.5 text-xs font-mono">
              {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-1 rounded-lg capitalize transition-all ${
                    filterSeverity === sev
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-white/40 font-mono">
            Loading reconciliation audit data...
          </div>
        ) : filteredDiscrepancies.length === 0 ? (
          <div className="py-12 text-center text-xs text-white/40 font-mono flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Zero discrepancies found under current filter criteria.</span>
            <span className="text-[11px] text-white/30">
              All payment references, canonical IDs, and ledger entries are synchronized.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono text-white/40 uppercase">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Amounts</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {filteredDiscrepancies.map((disc) => {
                  const sevMeta = SEVERITY_COLORS[disc.severity] || SEVERITY_COLORS.low
                  const isResolved = disc.status === 'resolved'

                  return (
                    <tr key={disc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <span className="text-cyan-400 font-bold capitalize">
                          {disc.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${sevMeta.badge}`}
                        >
                          {disc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white/80 font-mono font-bold">
                        {disc.reference || disc.orderNumber || disc.id}
                      </td>
                      <td className="py-3 px-3 text-white/60 max-w-sm truncate">
                        {disc.description}
                      </td>
                      <td className="py-3 px-3 text-white/50">
                        {disc.expectedAmountMinor !== undefined || disc.actualAmountMinor !== undefined ? (
                          <div className="flex flex-col text-[11px]">
                            <span>
                              Exp: {disc.expectedAmountMinor !== undefined ? formatINR(disc.expectedAmountMinor) : '—'}
                            </span>
                            <span className="text-rose-400">
                              Act: {disc.actualAmountMinor !== undefined ? formatINR(disc.actualAmountMinor) : '—'}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                            <AlertCircle className="w-3 h-3" />
                            Open
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenResolveModal(disc)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/80 hover:text-white border border-white/10 transition-all active:scale-95"
                        >
                          {isResolved ? 'View Notes' : 'Resolve'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discrepancy Resolution Dialog */}
      {resolvingDiscrepancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0c0e12] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Resolve Audit Discrepancy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingDiscrepancy(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="text-white/40 font-mono text-[10px] uppercase">Anomaly Summary</div>
                <div className="text-white font-semibold">{resolvingDiscrepancy.discrepancy.description}</div>
                <div className="text-[11px] font-mono text-cyan-400">
                  Ref: {resolvingDiscrepancy.discrepancy.reference || resolvingDiscrepancy.discrepancy.id}
                </div>
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1 text-[11px]">
                  Audit Resolution / Reconciliation Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Bank statement checked. UTR validated with SunPay payment gateway ID..."
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setResolvingDiscrepancy(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={isSubmittingResolution}
                className="px-4 py-1.5 rounded-xl bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmittingResolution ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
