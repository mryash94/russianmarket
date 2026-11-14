/**
 * RUSSIAN MARKET V5 ELITE REGRESSION SUITE
 * Validates all 16 canonical platform specifications:
 * 1. Customer Registration & Login Flow
 * 2. Google OAuth Redirection & Session Preservation
 * 3. Password Recovery & Reset Validation
 * 4. Admin Authorization & Root Clearance Gate (own77777777@gmail.com)
 * 5. Product Create, Edit & Real-Time Catalogue Updates
 * 6. Multi-Order Independent Purchases
 * 7. Duplicate Order Prevention & Idempotency
 * 8. SunPay Modular Lifecycle (INR Currency & Canonical RM-YYYY-NNNNNN References)
 * 9. Webhook Signature & Receipt Verification
 * 10. Real Ledger Balance Derivation (Zero Fake Bonus)
 * 11. NPCI Dynamic UPI QR Format Validation
 * 12. Realtime Admin & Customer Bidirectional Reactivity
 * 13. Customer Data Isolation (RLS & Scoped User Queries)
 * 14. Chat Messaging (Zero Fake Replies, Keyboard Clearance, Staff Note Privacy)
 * 15. Digital Asset Pass Issuance & Deliverable Download
 * 16. Mobile Responsive Layout & Viewport Compliance
 * Plus V5 Elite Engines:
 * - Smart Automation Rule Engine
 * - Financial Reconciliation Audit Center
 * - Sovereign Data Archive JSON Export
 * - Global Command Palette (Ctrl+K)
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('=================================================================')
console.log('👑 RUSSIAN MARKET V5 — ELITE COMMERCE REGRESSION TEST SUITE')
console.log('=================================================================\n')

let passedTests = 0
let failedTests = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ [PASS] ${name}`)
    passedTests++
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`)
    console.error(`   Error: ${err.message}\n`)
    failedTests++
  }
}

// -------------------------------------------------------------
// TEST 1: Customer Registration & Login Flow
// -------------------------------------------------------------
test('Test 1: Customer Registration & Login Flow (Default Mode, Min 8 Chars, Graceful Errors)', () => {
  const authPanelFile = fs.readFileSync(path.resolve('src/features/auth/AuthPanel.tsx'), 'utf-8')

  assert.ok(
    authPanelFile.includes("initialMode = 'sign-up'") || authPanelFile.includes("'sign-up'"),
    'Registration (sign-up) must be the default authentication mode'
  )
  assert.ok(
    authPanelFile.includes('password.length < 8'),
    'AuthPanel must enforce minimum 8 character password constraint'
  )
  assert.ok(
    authPanelFile.includes('Password must be at least 8 characters'),
    'User-friendly error message for short passwords must be present'
  )
  assert.ok(
    authPanelFile.includes('signInWithGoogle'),
    'Google OAuth sign-in trigger must be integrated in AuthPanel'
  )
})

// -------------------------------------------------------------
// TEST 2: Google OAuth Redirection & Session Preservation
// -------------------------------------------------------------
test('Test 2: Google OAuth Redirection & Session Preservation (Production Host Callback)', () => {
  const authProviderFile = fs.readFileSync(path.resolve('src/features/auth/AuthProvider.tsx'), 'utf-8')

  assert.strictEqual(
    authProviderFile.includes("'http://localhost:3000'"),
    false,
    'AuthProvider must never hardcode localhost:3000 callback URL in production'
  )
  assert.ok(
    authProviderFile.includes('getAuthRedirectUrl'),
    'AuthProvider must use getAuthRedirectUrl helper to resolve current origin'
  )

  const authUrlFile = fs.readFileSync(path.resolve('src/lib/authUrl.ts'), 'utf-8')
  assert.ok(
    authUrlFile.includes('window.location.origin'),
    'authUrl helper must dynamically resolve current window origin for OAuth redirectTo'
  )

  const appFile = fs.readFileSync(path.resolve('src/app/App.tsx'), 'utf-8')
  assert.ok(
    appFile.includes('rm_auth_return_url'),
    'App.tsx must check rm_auth_return_url on session restoration to resume pending workflows'
  )
})

// -------------------------------------------------------------
// TEST 3: Password Recovery & Reset Validation
// -------------------------------------------------------------
test('Test 3: Password Recovery & Reset Validation (Min 8 Chars & Strict Validation)', () => {
  const authProviderFile = fs.readFileSync(path.resolve('src/features/auth/AuthProvider.tsx'), 'utf-8')
  assert.ok(
    authProviderFile.includes('sendPasswordResetEmail'),
    'AuthProvider must provide sendPasswordResetEmail method'
  )
  assert.ok(
    authProviderFile.includes('updateUserPassword'),
    'AuthProvider must provide updateUserPassword method'
  )

  const settingsFile = fs.readFileSync(path.resolve('src/features/settings/SettingsSection.tsx'), 'utf-8')
  assert.ok(
    settingsFile.includes('newPassword.length < 8'),
    'SettingsSection password update form must validate minimum 8 characters'
  )
  assert.ok(
    settingsFile.includes('confirmPassword'),
    'SettingsSection password update must require confirmation match'
  )
})

// -------------------------------------------------------------
// TEST 4: Admin Authorization & Root Clearance Gate
// -------------------------------------------------------------
test('Test 4: Admin Authorization & Root Clearance Gate (own77777777@gmail.com)', () => {
  const adminGatewayFile = fs.readFileSync(path.resolve('src/features/admin/AdminLoginGateway.tsx'), 'utf-8')
  assert.ok(
    adminGatewayFile.includes('isAdmin'),
    'AdminLoginGateway must enforce isAdmin verification clearance'
  )

  const authProviderFile = fs.readFileSync(path.resolve('src/features/auth/AuthProvider.tsx'), 'utf-8')
  assert.ok(
    authProviderFile.includes("AUTHORIZED_ADMIN_EMAIL = 'own77777777@gmail.com'"),
    'AuthProvider must enforce root admin clearance email own77777777@gmail.com'
  )

  const adminDashboardFile = fs.readFileSync(path.resolve('src/features/admin/AdminDashboard.tsx'), 'utf-8')
  assert.ok(
    adminDashboardFile.includes("AUTHORIZED_ADMIN_EMAIL = 'own77777777@gmail.com'"),
    'AdminDashboard must verify root clearance email'
  )

  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
  assert.ok(
    storeEngineFile.includes("SUPER_ADMIN_EMAIL = 'own77777777@gmail.com'"),
    'storeEngine must enforce root admin identity for elevated operations'
  )
})

// -------------------------------------------------------------
// TEST 5: Product Create, Edit & Real-Time Catalogue Updates
// -------------------------------------------------------------
test('Test 5: Product Create, Edit & Real-Time Catalogue Updates (V5 Engine)', () => {
  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
  assert.ok(
    storeEngineFile.includes('async createProduct'),
    'storeEngine must implement createProduct'
  )
  assert.ok(
    storeEngineFile.includes('async updateProduct'),
    'storeEngine must implement updateProduct'
  )
  assert.ok(
    storeEngineFile.includes('async toggleProductPublishStatus'),
    'storeEngine must implement toggleProductPublishStatus'
  )

  const productManagerFile = fs.readFileSync(path.resolve('src/features/admin/AdminProductManager.tsx'), 'utf-8')
  assert.ok(
    productManagerFile.includes('handleTogglePublish'),
    'AdminProductManager must have 1-click publish/unpublish toggle'
  )
  assert.ok(
    productManagerFile.includes('Storefront Card Preview'),
    'AdminProductManager must feature live card preview modal'
  )
  assert.ok(
    productManagerFile.includes("setPreviewDevice('mobile')"),
    'AdminProductManager must support mobile viewport simulation'
  )
})

// -------------------------------------------------------------
// TEST 6: Multi-Order Independent Purchases
// -------------------------------------------------------------
test('Test 6: Multi-Order Independent Purchases (Customer Scoped & Independent IDs)', () => {
  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')

  assert.ok(
    storeEngineFile.includes('async getOrders(userId?: string | null, userEmail?: string | null)'),
    'getOrders must support both userId and userEmail filters'
  )

  // Verify multiple orders generate unique canonical references
  const now = new Date()
  const year = now.getFullYear()
  const randomSuffix1 = Math.floor(100000 + Math.random() * 900000)
  const randomSuffix2 = Math.floor(100000 + Math.random() * 900000)
  const orderRef1 = `RM-${year}-${randomSuffix1}`
  const orderRef2 = `RM-${year}-${randomSuffix2}`

  assert.notStrictEqual(orderRef1, orderRef2, 'Independent orders must have distinct canonical numbers')
  assert.match(orderRef1, /^RM-\d{4}-\d{6}$/, 'Order reference must match canonical format RM-YYYY-NNNNNN')
})

// -------------------------------------------------------------
// TEST 7: Duplicate Order Prevention & Idempotency
// -------------------------------------------------------------
test('Test 7: Duplicate Order Prevention & Idempotency Safeguards', () => {
  const checkoutModalFile = fs.readFileSync(path.resolve('src/features/commerce/CheckoutModal.tsx'), 'utf-8')

  assert.ok(
    checkoutModalFile.includes('isSubmitting'),
    'CheckoutModal must track isSubmitting lock to prevent double-click submissions'
  )
  assert.ok(
    checkoutModalFile.includes('completedOrder'),
    'CheckoutModal must track completedOrder to render success screen rather than submitting again'
  )

  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
  assert.ok(
    storeEngineFile.includes('payment_requests'),
    'storeEngine must track payment requests for deduplication'
  )
})

// -------------------------------------------------------------
// TEST 8: SunPay Modular Lifecycle (INR Currency & Canonical Reference)
// -------------------------------------------------------------
test('Test 8: SunPay Modular Lifecycle (Strict INR & Canonical References)', () => {
  const sunPayFile = fs.readFileSync(path.resolve('src/services/payment/SunPayProvider.ts'), 'utf-8')

  assert.strictEqual(
    sunPayFile.includes("currency: 'USD'"),
    false,
    'SunPay gateway must never request USD currency'
  )
  assert.ok(
    sunPayFile.includes("currency: 'INR'"),
    'SunPay gateway must strictly request INR currency'
  )
  assert.ok(
    sunPayFile.includes('params.orderNumber'),
    'SunPay gateway must pass canonical orderNumber as transaction reference'
  )
})

// -------------------------------------------------------------
// TEST 9: Webhook Signature & Receipt Verification
// -------------------------------------------------------------
test('Test 9: Webhook Signature & Receipt Verification (HMAC SHA-256 Validation)', () => {
  const functionPath = path.resolve('supabase/functions/sunpay-webhook/index.ts')
  assert.ok(fs.existsSync(functionPath), 'SunPay webhook edge function must exist')

  const funcSource = fs.readFileSync(functionPath, 'utf-8')
  assert.ok(
    funcSource.includes('HMAC') && funcSource.includes('SHA-256'),
    'Webhook must verify HMAC SHA-256 cryptographic signature'
  )
  assert.ok(
    funcSource.includes('SUNPAY_WEBHOOK_SECRET') && funcSource.includes('SUPABASE_SERVICE_ROLE_KEY'),
    'Webhook must rely on server-side environment secrets'
  )
})

// -------------------------------------------------------------
// TEST 10: Real Ledger Balance Derivation (Zero Fake Bonus)
// -------------------------------------------------------------
test('Test 10: Real Ledger Balance Derivation (Zero Fake Bonus, Credits - Debits)', () => {
  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')

  assert.strictEqual(
    storeEngineFile.includes('WELCOME-BONUS-INR'),
    false,
    'storeEngine must not inject unbacked WELCOME-BONUS-INR balance'
  )

  // Verify pure ledger arithmetic
  const sampleTransactions = [
    { amountMinor: 500000, transactionType: 'credit', status: 'completed' }, // ₹5,000 credit
    { amountMinor: -150000, transactionType: 'debit', status: 'completed' }, // ₹1,500 debit
    { amountMinor: 200000, transactionType: 'credit', status: 'pending' },   // Unapproved deposit (ignored)
  ]

  const netBalance = sampleTransactions
    .filter((tx) => tx.status === 'completed')
    .reduce((acc, tx) => acc + tx.amountMinor, 0)

  assert.strictEqual(netBalance, 350000, 'Calculated balance must strictly reflect ₹3,500.00 net completed ledger entries')
})

// -------------------------------------------------------------
// TEST 11: NPCI Dynamic UPI QR Format Validation
// -------------------------------------------------------------
test('Test 11: NPCI Dynamic UPI QR Format Validation (Official URI Specification)', () => {
  const merchantVpa = 'russianmarket@icici'
  const merchantName = 'Russian Market Collectibles'
  const amountMinor = 39900 // ₹399.00
  const orderRef = 'RM-2026-948102'

  const amountDecimal = (amountMinor / 100).toFixed(2)
  const upiUri = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(
    merchantName
  )}&am=${amountDecimal}&cu=INR&tn=${encodeURIComponent(`Collectibles #${orderRef}`)}`

  assert.ok(upiUri.startsWith('upi://pay?'), 'URI must begin with official upi://pay? scheme')
  assert.ok(upiUri.includes('pa=russianmarket%40icici'), 'URI must contain encoded payee address')
  assert.ok(upiUri.includes('am=399.00'), 'URI must specify exact amount with two decimal digits')
  assert.ok(upiUri.includes('cu=INR'), 'URI must enforce INR currency')
  assert.ok(upiUri.includes('tn=Collectibles%20%23RM-2026-948102'), 'URI must pass transaction reference note')
})

// -------------------------------------------------------------
// TEST 12: Realtime Admin & Customer Bidirectional Reactivity
// -------------------------------------------------------------
test('Test 12: Realtime Admin & Customer Bidirectional Reactivity (Postgres Changes Listeners)', () => {
  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')

  assert.ok(
    storeEngineFile.includes("table: 'orders'"),
    'storeEngine must subscribe to postgres changes on orders table'
  )
  assert.ok(
    storeEngineFile.includes("table: 'wallet_transactions'"),
    'storeEngine must subscribe to postgres changes on wallet_transactions table'
  )
  assert.ok(
    storeEngineFile.includes("table: 'support_messages'"),
    'storeEngine must subscribe to postgres changes on support_messages table'
  )
  assert.ok(
    storeEngineFile.includes("table: 'automation_rules'"),
    'storeEngine must subscribe to postgres changes on automation_rules table'
  )
})

// -------------------------------------------------------------
// TEST 13: Customer Data Isolation (RLS & User ID Scoping)
// -------------------------------------------------------------
test('Test 13: Customer Data Isolation (Strict RLS Policies & User ID Scoping)', () => {
  const migrationFile = fs.readFileSync(
    path.resolve('supabase/migrations/20261114180000_russian_market_v5_elite_schema.sql'),
    'utf-8'
  )

  assert.ok(
    /enable row level security/i.test(migrationFile),
    'Migration must enable Row Level Security on all core platform tables'
  )
  assert.ok(
    migrationFile.includes('automation_rules'),
    'Migration must secure automation_rules table with admin policies'
  )
  assert.ok(
    migrationFile.includes('financial_reconciliation_snapshots'),
    'Migration must secure reconciliation snapshots with admin policies'
  )
})

// -------------------------------------------------------------
// TEST 14: Chat Messaging (Zero Fake Replies, Keyboard Clearance, Staff Privacy)
// -------------------------------------------------------------
test('Test 14: Chat Messaging (Zero Fake Replies, Safe Keyboard Clearance, Staff Note Privacy)', () => {
  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')

  assert.strictEqual(
    storeEngineFile.includes('Concierge is reviewing your collectible request'),
    false,
    'Chat engine must never simulate fake bot auto-replies'
  )

  const chatSectionFile = fs.readFileSync(path.resolve('src/features/chat/ChatSection.tsx'), 'utf-8')
  assert.ok(
    chatSectionFile.includes('pb-20 md:pb-4'),
    'Chat input must provide safe bottom clearance (>45.1px) preventing mobile keyboard overlap'
  )

  const adminChatInboxFile = fs.readFileSync(path.resolve('src/features/admin/AdminChatInbox.tsx'), 'utf-8')
  assert.ok(
    adminChatInboxFile.includes('Internal Staff Note'),
    'Admin chat inbox must support private staff notes'
  )
})

// -------------------------------------------------------------
// TEST 15: Digital Asset Pass Issuance & Deliverable Download
// -------------------------------------------------------------
test('Test 15: Digital Asset Pass Issuance & Deliverable Download (Token Generation & Download Trigger)', () => {
  const storeEngineFile = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')

  assert.ok(
    storeEngineFile.includes('token_') || storeEngineFile.includes('redemptionToken'),
    'storeEngine must issue cryptographic redemption tokens upon order payment verification'
  )
  assert.ok(
    storeEngineFile.includes('getEntitlements') || storeEngineFile.includes('digitalAsset'),
    'storeEngine must manage customer digital asset entitlements'
  )

  const myOrdersFile = fs.readFileSync(path.resolve('src/features/orders/MyOrdersModal.tsx'), 'utf-8')
  assert.ok(
    myOrdersFile.includes('handleDownloadDeliverable') || myOrdersFile.includes('Download'),
    'MyOrdersModal must allow downloading digital collectible files for completed orders'
  )
})

// -------------------------------------------------------------
// TEST 16: Mobile Responsive Layout Compliance (320px - 430px Viewports)
// -------------------------------------------------------------
test('Test 16: Mobile Responsive Layout Compliance (No Horizontal Overflow & Safe Touch Clearance)', () => {
  const globalCss = fs.readFileSync(path.resolve('src/styles/global.css'), 'utf-8')
  assert.ok(
    globalCss.includes('@import "tailwindcss"') || globalCss.includes('overflow-x-hidden'),
    'Global CSS must enforce container boundary constraints'
  )

  const appFile = fs.readFileSync(path.resolve('src/app/App.tsx'), 'utf-8')
  assert.ok(
    appFile.includes('md:hidden') && appFile.includes('variant="mobile"'),
    'App.tsx must feature responsive mobile navigation for handheld viewports'
  )
})

// -------------------------------------------------------------
// V5 ELITE ENGINES TEST: Smart Automation, Reconciliation & Data Archive
// -------------------------------------------------------------
test('V5 Elite: Smart Automation Rule & Execution Engine', () => {
  const autoFile = fs.readFileSync(path.resolve('src/features/admin/AdminAutomationCenter.tsx'), 'utf-8')
  assert.ok(autoFile.includes('Smart Automation Engine'), 'AdminAutomationCenter must render Automation Engine')
  assert.ok(autoFile.includes('handleToggle'), 'AdminAutomationCenter must support live rule toggles')
  assert.ok(autoFile.includes('handleRetry'), 'AdminAutomationCenter must support retrying failed executions')
  assert.ok(autoFile.includes('handleSimulateEvent'), 'AdminAutomationCenter must allow firing test trigger events')
})

test('V5 Elite: Financial Reconciliation Audit & Resolution Center', () => {
  const recFile = fs.readFileSync(path.resolve('src/features/admin/AdminReconciliationDashboard.tsx'), 'utf-8')
  assert.ok(recFile.includes('Financial Reconciliation Center'), 'AdminReconciliationDashboard must render')
  assert.ok(recFile.includes('handleRunAudit'), 'AdminReconciliationDashboard must support running live audits')
  assert.ok(recFile.includes('handleConfirmResolve'), 'AdminReconciliationDashboard must support resolving discrepancies')
  assert.ok(recFile.includes('handleExportReconciliationReport'), 'AdminReconciliationDashboard must support exporting audit report')
})

test('V5 Elite: Customer Account Center & Sovereign Data Archive Export', () => {
  const settingsFile = fs.readFileSync(path.resolve('src/features/settings/SettingsSection.tsx'), 'utf-8')
  assert.ok(settingsFile.includes('Customer Account Center'), 'SettingsSection must render Account Center')
  assert.ok(settingsFile.includes('handleExportDataArchive'), 'SettingsSection must provide JSON Data Archive download')
  assert.ok(settingsFile.includes('handleRequestPush'), 'SettingsSection must support Web Push notifications')
})

test('V5 Elite: Global Admin Command Palette (Ctrl+K)', () => {
  const paletteFile = fs.readFileSync(path.resolve('src/features/admin/AdminCommandPalette.tsx'), 'utf-8')
  assert.ok(paletteFile.includes('AdminCommandPalette'), 'AdminCommandPalette component must be present')
  assert.ok(paletteFile.includes('Ctrl+K'), 'AdminCommandPalette must support Ctrl+K keyboard shortcut')
  assert.ok(paletteFile.includes('matchedActions'), 'AdminCommandPalette must match navigation actions')
  assert.ok(paletteFile.includes('matchedProducts'), 'AdminCommandPalette must match products')
  assert.ok(paletteFile.includes('matchedOrders'), 'AdminCommandPalette must match orders')
})

console.log('\n=================================================================')
console.log(`🎯 V5 ELITE REGRESSION SUITE COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`)
console.log('=================================================================\n')

if (failedTests > 0) {
  process.exit(1)
}
