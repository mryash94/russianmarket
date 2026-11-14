import { formatINR } from './currency'
import type { Order, WalletTx, DepositRequest } from '../services/storeEngine'

export interface CustomerCRMRecord {
  email: string
  name: string
  userId: string
  orders: Order[]
  totalSpentMinor: number
  walletBalanceMinor: number
  walletTxCount: number
  firstSeen: string
  lastSeen: string
  tier: 'VIP Sovereign' | 'Verified Collector' | 'Prospect'
}

/**
 * Triggers a browser download of a formatted string file.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

/**
 * Export Orders to CSV
 */
export function exportOrdersToCSV(orders: Order[]): void {
  const headers = [
    'Order ID',
    'Order Number',
    'Date (ISO)',
    'Customer Email',
    'Customer Name',
    'User ID',
    'Status',
    'Subtotal Minor',
    'Formatted Subtotal',
    'Payment Method',
    'Payment Reference',
    'Items Count',
    'Items Summary',
  ]

  const rows = orders.map((o) => {
    const itemsSummary = o.items
      .map((it) => `${it.productName} (${it.sku} x${it.quantity})`)
      .join('; ')

    return [
      escapeCSV(o.id),
      escapeCSV(o.orderNumber),
      escapeCSV(o.id.startsWith('ord_') ? new Date(parseInt(o.id.split('_')[1] || `${Date.now()}`)).toISOString() : new Date().toISOString()),
      escapeCSV(o.customerEmail),
      escapeCSV(o.customerName || 'N/A'),
      escapeCSV(o.userId),
      escapeCSV(o.status),
      escapeCSV(o.subtotalMinor),
      escapeCSV(formatINR(o.subtotalMinor)),
      escapeCSV(o.paymentMethod),
      escapeCSV(o.paymentReference || 'N/A'),
      escapeCSV(o.items.length),
      escapeCSV(itemsSummary),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\r\n')
  const filename = `russian_market_orders_${new Date().toISOString().slice(0, 10)}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export Orders to JSON
 */
export function exportOrdersToJSON(orders: Order[]): void {
  const json = JSON.stringify(orders, null, 2)
  const filename = `russian_market_orders_${new Date().toISOString().slice(0, 10)}.json`
  downloadFile(json, filename, 'application/json;charset=utf-8;')
}

/**
 * Export Customers CRM to CSV
 */
export function exportCustomersToCSV(customers: CustomerCRMRecord[]): void {
  const headers = [
    'Collector Email',
    'Name',
    'User ID',
    'Tier Status',
    'Total Acquisitions',
    'Lifetime Value Minor',
    'Lifetime Value Formatted',
    'Wallet Balance Minor',
    'Wallet Balance Formatted',
    'Wallet Tx Count',
    'First Activity',
    'Last Activity',
  ]

  const rows = customers.map((c) => [
    escapeCSV(c.email),
    escapeCSV(c.name),
    escapeCSV(c.userId),
    escapeCSV(c.tier),
    escapeCSV(c.orders.length),
    escapeCSV(c.totalSpentMinor),
    escapeCSV(formatINR(c.totalSpentMinor)),
    escapeCSV(c.walletBalanceMinor),
    escapeCSV(formatINR(c.walletBalanceMinor)),
    escapeCSV(c.walletTxCount),
    escapeCSV(c.firstSeen),
    escapeCSV(c.lastSeen),
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\r\n')
  const filename = `russian_market_collectors_crm_${new Date().toISOString().slice(0, 10)}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export Customers CRM to JSON
 */
export function exportCustomersToJSON(customers: CustomerCRMRecord[]): void {
  const json = JSON.stringify(customers, null, 2)
  const filename = `russian_market_collectors_crm_${new Date().toISOString().slice(0, 10)}.json`
  downloadFile(json, filename, 'application/json;charset=utf-8;')
}

/**
 * Export Wallet Transactions to CSV
 */
export function exportWalletTransactionsToCSV(txs: WalletTx[]): void {
  const headers = [
    'Transaction ID',
    'Created At',
    'User ID',
    'Type',
    'Status',
    'Amount Minor',
    'Formatted Amount',
    'Reference',
    'UTR Number',
    'Description',
  ]

  const rows = txs.map((tx) => [
    escapeCSV(tx.id),
    escapeCSV(tx.createdAt),
    escapeCSV(tx.userId),
    escapeCSV(tx.transactionType),
    escapeCSV(tx.status),
    escapeCSV(tx.amountMinor),
    escapeCSV(formatINR(tx.amountMinor)),
    escapeCSV(tx.reference || 'N/A'),
    escapeCSV(tx.utrNumber || 'N/A'),
    escapeCSV(tx.description),
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\r\n')
  const filename = `russian_market_wallet_ledger_${new Date().toISOString().slice(0, 10)}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export Payment / Deposit Requests to CSV
 */
export function exportPaymentRequestsToCSV(requests: DepositRequest[]): void {
  const headers = [
    'Request ID',
    'Created At',
    'User Email',
    'User ID',
    'Amount Minor',
    'Formatted Amount',
    'Status',
    'UTR Number',
    'Reference',
    'Reviewed At',
    'Notes / Reason',
  ]

  const rows = requests.map((r) => [
    escapeCSV(r.id),
    escapeCSV(r.createdAt),
    escapeCSV(r.userEmail),
    escapeCSV(r.userId),
    escapeCSV(r.amountMinor),
    escapeCSV(formatINR(r.amountMinor)),
    escapeCSV(r.status),
    escapeCSV(r.utrNumber),
    escapeCSV(r.reference),
    escapeCSV(r.reviewedAt || 'N/A'),
    escapeCSV(r.notes || r.rejectionReason || 'N/A'),
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\r\n')
  const filename = `russian_market_payment_requests_${new Date().toISOString().slice(0, 10)}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}
