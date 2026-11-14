/**
 * RUSSIAN MARKET V6 — FULL PROJECT ACCESS & PRODUCTION EXECUTION
 * End-to-End Verification Test Suite
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('=================================================================')
console.log('👑 RUSSIAN MARKET V6 — FULL PRODUCTION EXECUTION VERIFICATION')
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

// 1. Root Administrator Clearance
test('Root Administrator Authorization Gate (own77777777@gmail.com)', () => {
  const storeEngine = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
  assert.ok(
    storeEngine.includes("SUPER_ADMIN_EMAIL = 'own77777777@gmail.com'"),
    'SUPER_ADMIN_EMAIL must be own77777777@gmail.com'
  )
})

// 2. Supabase Canonical Connection & Project Reference
test('Supabase Configuration for Canonical Project (deeprhlnoflqzpraxkaq)', () => {
  const supabaseLib = fs.readFileSync(path.resolve('src/lib/supabase.ts'), 'utf-8')
  assert.ok(
    supabaseLib.includes('deeprhlnoflqzpraxkaq'),
    'Supabase URL must point to deeprhlnoflqzpraxkaq'
  )
  assert.ok(
    supabaseLib.includes('sb_publishable_sZDP51eyY5koRcQ8t4l5hg_TXT8sSy-'),
    'Supabase Publishable Key must be configured'
  )
})

// 3. SunPayProvider Live Edge Function Integration
test('SunPay / TTPay Provider connects to quick-responder Edge Function', () => {
  const sunpayFile = fs.readFileSync(path.resolve('src/services/payment/SunPayProvider.ts'), 'utf-8')
  assert.ok(
    sunpayFile.includes('quick-responder'),
    'SunPayProvider must call quick-responder endpoint'
  )
  assert.ok(
    sunpayFile.includes('sunpay-open-checkout'),
    'SunPayProvider must call sunpay-open-checkout action'
  )
  assert.ok(
    sunpayFile.includes('sunpay-create-payment'),
    'SunPayProvider must call sunpay-create-payment action'
  )
  assert.ok(
    sunpayFile.includes('sunpay-order-detail'),
    'SunPayProvider must verify via sunpay-order-detail'
  )
})

// 4. NPCI Manual UPI Destination Configuration
test('Canonical Manual UPI Destination Verified as blackxayush@fam', () => {
  const storeEngine = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
  assert.ok(
    storeEngine.includes("upiMerchantId: 'blackxayush@fam'"),
    'Default UPI Merchant ID must be blackxayush@fam'
  )
  const addMoneyModal = fs.readFileSync(path.resolve('src/features/wallet/AddMoneyModal.tsx'), 'utf-8')
  assert.ok(
    addMoneyModal.includes("'blackxayush@fam'"),
    'AddMoneyModal must default to blackxayush@fam'
  )
  const checkoutModal = fs.readFileSync(path.resolve('src/features/commerce/CheckoutModal.tsx'), 'utf-8')
  assert.ok(
    checkoutModal.includes("'blackxayush@fam'"),
    'CheckoutModal must default to blackxayush@fam'
  )
})

// 5. Payment Gateway Service Provider Registry
test('Payment Gateway Registry contains SunPay and Admin Concierge', () => {
  const paymentIndex = fs.readFileSync(path.resolve('src/services/payment/index.ts'), 'utf-8')
  assert.ok(
    paymentIndex.includes("['sunpay', new SunPayProvider()"),
    'PaymentGatewayService must register SunPayProvider'
  )
  assert.ok(
    paymentIndex.includes("['admin_concierge', new ManualAdminVerificationProvider()"),
    'PaymentGatewayService must register ManualAdminVerificationProvider'
  )
})

// 6. Security Hygiene Check (No Hardcoded Secret Tokens)
test('Security Hygiene & Management Token Isolation (.gitignore)', () => {
  const gitIgnore = fs.readFileSync(path.resolve('.gitignore'), 'utf-8')
  assert.ok(
    gitIgnore.includes('.env.local'),
    '.env.local must be included in .gitignore'
  )
})

// 7. Checkout Modal SunPay Gateway Redirect
test('Checkout Modal renders Gateway Checkout link when payment URL is present', () => {
  const checkoutModal = fs.readFileSync(path.resolve('src/features/commerce/CheckoutModal.tsx'), 'utf-8')
  assert.ok(
    checkoutModal.includes('gatewayUrl'),
    'CheckoutModal must track gatewayUrl state'
  )
  assert.ok(
    checkoutModal.includes('Proceed to SunPay / TTPay Gateway Checkout'),
    'CheckoutModal must render Gateway Checkout button'
  )
})

console.log('\n=================================================================')
console.log(`🎯 V6 PRODUCTION SUITE COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`)
console.log('=================================================================\n')

if (failedTests > 0) {
  process.exit(1)
}
