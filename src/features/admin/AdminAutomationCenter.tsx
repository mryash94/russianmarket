import { useState, useEffect, useCallback } from 'react'
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Play,
  Terminal,
  ShieldAlert,
  ChevronDown,
  Activity,
  Layers,
} from 'lucide-react'
import {
  storeEngine,
  type AutomationRule,
  type AutomationLog,
  type AutomationEventTrigger,
} from '../../services/storeEngine'

type AdminAutomationCenterProps = {
  onNotify?: (msg: string) => void
}

const EVENT_TRIGGER_LABELS: Record<AutomationEventTrigger, { label: string; color: string }> = {
  on_new_order: { label: 'New Order Created', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10' },
  on_verified_payment: { label: 'Payment Verified', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' },
  on_expired_payment: { label: 'Payment Expired (15m)', color: 'text-amber-400 border-amber-400/20 bg-amber-400/10' },
  on_digital_delivery: { label: 'Digital Token Issued', color: 'text-purple-400 border-purple-400/20 bg-purple-400/10' },
  on_new_support_message: { label: 'Support Ticket Inbound', color: 'text-blue-400 border-blue-400/20 bg-blue-400/10' },
  on_low_inventory: { label: 'Low Inventory Alert', color: 'text-rose-400 border-rose-400/20 bg-rose-400/10' },
  on_failed_integration: { label: 'System Integration Error', color: 'text-red-400 border-red-400/20 bg-red-400/10' },
}

export function AdminAutomationCenter({ onNotify }: AdminAutomationCenterProps) {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null)
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all')
  const [testTrigger, setTestTrigger] = useState<AutomationEventTrigger>('on_new_order')
  const [isSimulating, setIsSimulating] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [r, l] = await Promise.all([
        storeEngine.getAutomationRules(),
        storeEngine.getAutomationLogs(),
      ])
      setRules(r)
      setLogs(l)
    } catch (err) {
      console.error('Failed to load automation data:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
    const unsub = storeEngine.subscribe(() => {
      void loadData()
    })
    return () => unsub()
  }, [loadData])

  const handleToggle = async (rule: AutomationRule) => {
    setTogglingRuleId(rule.id)
    try {
      const success = await storeEngine.toggleAutomationRule(rule.id, !rule.isEnabled)
      if (success) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r))
        )
        onNotify?.(`Automation "${rule.name}" ${!rule.isEnabled ? 'activated' : 'paused'}`)
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    } finally {
      setTogglingRuleId(null)
    }
  }

  const handleRetry = async (logId: string) => {
    setRetryingLogId(logId)
    try {
      const success = await storeEngine.retryAutomationLog(logId)
      if (success) {
        onNotify?.('Automation event re-queued and executed successfully')
        await loadData()
      } else {
        onNotify?.('Retry failed. Review execution error log.')
      }
    } catch (err) {
      console.error('Retry error:', err)
    } finally {
      setRetryingLogId(null)
    }
  }

  const handleSimulateEvent = async () => {
    setIsSimulating(true)
    try {
      await storeEngine.triggerAutomationEvent(testTrigger, {
        simulated: true,
        referenceId: `SIM-${Date.now().toString().slice(-6)}`,
        triggeredBy: 'admin_control_center',
        timestamp: new Date().toISOString(),
      })
      onNotify?.(`Event "${testTrigger}" dispatched successfully`)
      await loadData()
    } catch (err) {
      console.error('Simulation error:', err)
    } finally {
      setIsSimulating(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (selectedFilter === 'all') return true
    return log.status === selectedFilter
  })

  const totalRuns = rules.reduce((acc, r) => acc + (r.executionCount || 0), 0)
  const activeCount = rules.filter((r) => r.isEnabled).length
  const failedCount = logs.filter((l) => l.status === 'failed').length

  return (
    <div className="space-y-6">
      {/* Header & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0c0e12] border border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-white tracking-tight">Smart Automation Engine</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              V5 ELITE
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Autonomous event triggers, automatic order status progression, instant token delivery & staff dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true)
              void loadData()
            }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-all border border-white/10 active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Active Rules</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {activeCount} <span className="text-xs font-normal text-white/40">/ {rules.length}</span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">Operational autonomous triggers</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Total Executions</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {totalRuns.toLocaleString()}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Lifecycle events automated</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Failures / Errors</span>
            <ShieldAlert className={`w-4 h-4 ${failedCount > 0 ? 'text-rose-400' : 'text-white/30'}`} />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono ${failedCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {failedCount}
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            {failedCount > 0 ? 'Requires attention / retry' : 'Zero unhandled failures'}
          </p>
        </div>
      </div>

      {/* Rules Control Board */}
      <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Event Trigger Pipeline
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              Instant edge evaluation on PostgreSQL change feeds & webhook callbacks
            </p>
          </div>

          {/* Test Event Simulator */}
          <div className="flex items-center gap-2">
            <select
              value={testTrigger}
              onChange={(e) => setTestTrigger(e.target.value as AutomationEventTrigger)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {Object.entries(EVENT_TRIGGER_LABELS).map(([k, v]) => (
                <option key={k} value={k} className="bg-[#12141a] text-white">
                  {v.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSimulateEvent}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              {isSimulating ? 'Firing...' : 'Fire Test Event'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-white/40 font-mono">
            Loading automation rule registry...
          </div>
        ) : rules.length === 0 ? (
          <div className="py-12 text-center text-xs text-white/40 font-mono">
            No automation rules configured. Run database migration `20261114180000_russian_market_v5_elite_schema.sql`.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rules.map((rule) => {
              const triggerMeta = EVENT_TRIGGER_LABELS[rule.eventTrigger] || {
                label: rule.eventTrigger,
                color: 'text-white/60 border-white/10 bg-white/5',
              }
              const isToggling = togglingRuleId === rule.id

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.isEnabled
                      ? 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      : 'bg-black/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-white">{rule.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${triggerMeta.color}`}
                        >
                          {triggerMeta.label}
                        </span>
                        {rule.lastStatus && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                              rule.lastStatus === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            Last: {rule.lastStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50">{rule.description}</p>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-white/40 pt-1">
                        <span>Total Runs: <strong className="text-white">{rule.executionCount || 0}</strong></span>
                        {rule.lastExecutedAt && (
                          <span>
                            Last Run:{' '}
                            <strong className="text-white">
                              {new Date(rule.lastExecutedAt).toLocaleTimeString()}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(rule)}
                        disabled={isToggling}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.isEnabled ? 'bg-cyan-400' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                            rule.isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Execution Audit Log */}
      <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Execution Audit Log
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'success', 'failed', 'pending'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium capitalize transition-all ${
                  selectedFilter === filter
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/40 font-mono">
            No execution logs matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono text-white/40 uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Trigger Event</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Actions Taken</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {filteredLogs.map((log) => {
                  const isRetrying = retryingLogId === log.id
                  const isExpanded = expandedLogId === log.id

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-white/50 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-cyan-400 font-bold">{log.eventType}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : log.status === 'failed' ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white/40">
                        {log.retryCount > 0 ? `Retry #${log.retryCount}` : 'Direct'}
                      </td>
                      <td className="py-3 px-3 text-white/70 max-w-xs truncate">
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-left hover:text-white flex items-center gap-1 group"
                        >
                          <span className="truncate">
                            {log.errorMessage
                              ? `Err: ${log.errorMessage}`
                              : JSON.stringify(log.details || {})}
                          </span>
                          <ChevronDown
                            className={`w-3 h-3 shrink-0 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 rounded-lg bg-black/80 border border-white/10 text-[11px] font-mono text-cyan-300 whitespace-pre-wrap break-all">
                            <div><strong>Details:</strong> {JSON.stringify(log.details, null, 2)}</div>
                            {log.errorMessage && (
                              <div className="mt-1 text-rose-400"><strong>Error:</strong> {log.errorMessage}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {log.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => handleRetry(log.id)}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/80 hover:text-white border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <RotateCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-cyan-400' : ''}`} />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
