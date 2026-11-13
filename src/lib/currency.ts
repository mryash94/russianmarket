/**
 * Indian Rupee (INR) currency formatting utility for Russian Market.
 * Formats integer paise amounts into standard Indian currency representation.
 *
 * Examples:
 *   formatINR(39900)  -> "₹399"
 *   formatINR(129900) -> "₹1,299"
 *   formatINR(249900) -> "₹2,499"
 */
export function formatINR(paise: number): string {
  if (isNaN(paise) || paise === null || paise === undefined) {
    return '₹0'
  }
  const rupees = Math.round(paise / 100)
  return `₹${rupees.toLocaleString('en-IN')}`
}

/**
 * Format INR with explicit paise if non-zero, or clean integer rupees.
 */
export function formatINRExact(paise: number): string {
  if (isNaN(paise) || paise === null || paise === undefined) {
    return '₹0'
  }
  const rupees = paise / 100
  if (paise % 100 === 0) {
    return `₹${rupees.toLocaleString('en-IN')}`
  }
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
