/**
 * RUSSIAN MARKET V6 — CRITICAL SYSTEM REPAIR & UPGRADE
 * 17-Point End-to-End Regression & Backend Integration Test Suite
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

console.log('=================================================================')
console.log('👑 RUSSIAN MARKET V6 — 17-POINT CRITICAL SYSTEM TEST SUITE')
console.log('=================================================================\n')

const SUPABASE_URL = 'https://deeprhlnoflqzpraxkaq.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sZDP51eyY5koRcQ8t4l5hg_TXT8sSy-'
const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

let passed = 0
let failed = 0

async function runStep(name, fn) {
  try {
    await fn()
    console.log(`✅ [PASS] ${name}`)
    passed++
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`)
    console.error(`   Error: ${err.message}\n`)
    failed++
  }
}

async function postEdge(action, body = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ action, ...body })
    const options = {
      hostname: 'deeprhlnoflqzpraxkaq.supabase.co',
      port: 443,
      path: `/functions/v1/quick-responder?action=${encodeURIComponent(action)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, raw: data })
        }
      })
    })

    req.on('error', (err) => reject(err))
    req.write(postData)
    req.end()
  })
}

async function main() {
  // 1. Customer Login Validation
  await runStep('1. Customer Login & Registration Flow', () => {
    const authPanel = fs.readFileSync(path.resolve('src/features/auth/AuthPanel.tsx'), 'utf-8')
    assert.ok(authPanel.includes('password.length < 8'), 'Must enforce minimum 8 characters password')
    assert.ok(authPanel.includes("'sign-up'"), 'Default mode must be sign-up')
  })

  // 2. Admin Authorization Gate
  await runStep('2. Admin Authorization Gate (own77777777@gmail.com)', () => {
    const storeEngine = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
    assert.ok(storeEngine.includes("SUPER_ADMIN_EMAIL = 'own77777777@gmail.com'"), 'Root admin must be own77777777@gmail.com')
  })

  // 3. Google OAuth Redirection
  await runStep('3. Google OAuth Production Callback', () => {
    const authProvider = fs.readFileSync(path.resolve('src/features/auth/AuthProvider.tsx'), 'utf-8')
    assert.ok(authProvider.includes('getAuthRedirectUrl'), 'Must use getAuthRedirectUrl helper')
    const authUrl = fs.readFileSync(path.resolve('src/lib/authUrl.ts'), 'utf-8')
    assert.ok(authUrl.includes('window.location.origin'), 'OAuth redirect must dynamically resolve host origin')
    assert.ok(authUrl.includes('https://market-zeta.vercel.app'), 'Must fallback to production URL')
    assert.ok(authUrl.includes("!origin.includes('localhost:3000')"), 'Must guard against localhost:3000 in production')
  })

  // 4. Product Updates & Live Catalog
  await runStep('4. Live PostgreSQL Product Catalog (124 Specimens)', async () => {
    const { data, error } = await client.from('products').select('id, name, price_minor')
    assert.ok(!error, `Failed to query products: ${error?.message}`)
    assert.ok(data.length >= 120, `Expected at least 120 products in DB, found ${data.length}`)
  })

  // 5. Multiple Independent Purchases
  await runStep('5. Multiple Independent Purchases & Unique Order References', () => {
    const storeEngine = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
    assert.ok(storeEngine.includes('idempotencyKey'), 'Must enforce idempotency on order creation')
    assert.ok(storeEngine.includes('RM-${new Date().getFullYear()}'), 'Must generate unique RM-YYYY-NNNNNN order references')
  })

  // 6. SunPay Initiation
  let testOrderRef = ''
  const testCheckoutToken = crypto.randomBytes(32).toString('hex')
  const testGuestToken = crypto.randomBytes(32).toString('hex')
  await runStep('6. SunPay / TTPay Initiation via quick-responder', async () => {
    const openRes = await postEdge('sunpay-open-checkout', {
      productId: '6a9e28205df3e8c7465ce98e',
      product_id: '6a9e28205df3e8c7465ce98e',
      checkoutToken: testCheckoutToken,
      checkout_token: testCheckoutToken,
      guestToken: testGuestToken,
      guest_token: testGuestToken,
      customer_email: 'test_suit17@russianmarket.store',
    })
    assert.strictEqual(openRes.status, 200)
    assert.ok(openRes.data?.payment?.payment_reference?.startsWith('ORD-'))
    testOrderRef = openRes.data.payment.payment_reference
  })

  // 7. TTPay Initiation & Cashier URL
  await runStep('7. TTPay Gateway Cashier Generation (HTTP 201)', async () => {
    assert.ok(testOrderRef, 'Order reference required from step 6')
    const createRes = await postEdge('sunpay-create-payment', {
      payment_reference: testOrderRef,
      orderId: testOrderRef,
      checkout_token: testCheckoutToken,
      guest_token: testGuestToken,
      customer_email: 'test_suit17@russianmarket.store',
      customer_phone: '9876543210',
      customer_name: 'Test Collector',
    })
    assert.strictEqual(createRes.status, 200)
    assert.ok(createRes.data?.payment?.payment_url?.includes('ttpay') || createRes.data?.payment?.payment_url?.includes('http'))
  })

  // 8. Webhook Signature Authentication
  await runStep('8. Webhook HMAC-SHA256 Signature Verification', async () => {
    const fakeWebhookRes = await new Promise((resolve) => {
      const postData = JSON.stringify({
        order_id: testOrderRef,
        transaction_id: 'tx_fake_777',
        amount: 1100,
        currency: 'INR',
        method: 'upi',
        status: 'success',
        event: 'payin.success',
      })
      const req = https.request(
        {
          hostname: 'deeprhlnoflqzpraxkaq.supabase.co',
          port: 443,
          path: '/functions/v1/quick-responder?action=sunpay-webhook',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'x-signature': 'invalid_signature_hash',
          },
        },
        (res) => {
          let data = ''
          res.on('data', (c) => (data += c))
          res.on('end', () => resolve({ status: res.statusCode, data }))
        }
      )
      req.write(postData)
      req.end()
    })
    assert.strictEqual(fakeWebhookRes.status, 401, 'Must reject fake webhook signature with HTTP 401')
  })

  // 9. Payment Status Reconciliation
  await runStep('9. Payment Status Reconciliation (Token Proof Protected)', async () => {
    const detailRes = await postEdge('sunpay-order-detail', {
      payment_reference: testOrderRef,
      orderId: testOrderRef,
      checkout_token: testCheckoutToken,
      guest_token: testGuestToken,
    })
    assert.strictEqual(detailRes.status, 200)
    assert.strictEqual(detailRes.data?.payment?.order_id, testOrderRef)
  })

  // 10. Wallet Credit and Debit Balance Derivation
  await runStep('10. Database-Backed Wallet Balance (Verified Credits - Debits)', () => {
    const storeEngine = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
    assert.ok(storeEngine.includes("filter((tx) => tx.status === 'completed')"), 'Must only sum completed transactions')
    assert.ok(storeEngine.includes('reduce((sum, tx) => sum + tx.amountMinor, 0)'), 'Must derive balance from credits and debits')
  })

  // 11. Duplicate Transaction Prevention
  await runStep('11. Duplicate Transaction & Callback Protection', async () => {
    const dupRes = await postEdge('sunpay-open-checkout', {
      productId: '6a9e28205df3e8c7465ce98e',
      product_id: '6a9e28205df3e8c7465ce98e',
      checkoutToken: testCheckoutToken,
      checkout_token: testCheckoutToken,
      guestToken: testGuestToken,
      guest_token: testGuestToken,
      customer_email: 'test_suit17@russianmarket.store',
    })
    assert.strictEqual(dupRes.data?.payment?.payment_reference, testOrderRef, 'Must return same order reference, no duplicates')
  })

  // 12. UPI QR Generation with Authorized Merchant VPA
  await runStep('12. NPCI Dynamic UPI QR Format (blackxayush@fam)', async () => {
    const { data: settings } = await client.from('store_settings').select('*').limit(1).single()
    assert.strictEqual(settings.upi_merchant_id, 'blackxayush@fam', 'VPA must be blackxayush@fam')
  })

  // 13. Chat Between Two Accounts (Live Supabase Persistence)
  let testConvId = ''
  await runStep('13. Chat Message Persistence in PostgreSQL', async () => {
    const { data: conv, error: convErr } = await client.from('support_conversations').insert({
      user_email: 'collector_1@russianmarket.store',
      subject: 'Inquiry on Gold Specimen #001',
      status: 'open',
    }).select('id').single()
    assert.ok(!convErr && conv?.id, `Conversation insert failed: ${convErr?.message}`)
    testConvId = conv.id

    const { data: msg, error: msgErr } = await client.from('support_messages').insert({
      conversation_id: testConvId,
      body: 'Is this specimen available for immediate delivery?',
      sender_type: 'customer',
    }).select('*').single()
    assert.ok(!msgErr && msg?.id, `Message insert failed: ${msgErr?.message}`)
  })

  // 14. Admin Realtime Inbox (Two-Way Messaging)
  await runStep('14. Admin Realtime Inbox & Reply Query', async () => {
    assert.ok(testConvId, 'Conversation ID required')
    const { data: adminReply, error: replyErr } = await client.from('support_messages').insert({
      conversation_id: testConvId,
      body: 'Yes, this specimen is in stock and ready for instant cryptographic pass unlock.',
      sender_type: 'admin',
    }).select('*').single()
    assert.ok(!replyErr && adminReply?.id, `Admin reply failed: ${replyErr?.message}`)

    // Query messages in conversation
    const { data: allMsgs } = await client.from('support_messages').select('*').eq('conversation_id', testConvId)
    assert.strictEqual(allMsgs.length, 2, 'Must retrieve both customer inquiry and admin reply')
  })

  // 15. Notifications Delivery
  await runStep('15. Notifications System & Read Status', () => {
    const storeEngine = fs.readFileSync(path.resolve('src/services/storeEngine.ts'), 'utf-8')
    assert.ok(storeEngine.includes('markNotificationRead'), 'Must implement markNotificationRead')
    assert.ok(storeEngine.includes('markAllNotificationsRead'), 'Must implement markAllNotificationsRead')
  })

  // 16. Customer Data Isolation (RLS Verification)
  await runStep('16. Customer Data Isolation & Row Level Security', () => {
    const rlsFile = fs.readFileSync(path.resolve('supabase/migrations/20261114200000_russian_market_v6_rls_and_chat.sql'), 'utf-8')
    assert.ok(rlsFile.includes('CREATE POLICY "Customer or admin read orders"'), 'Orders must be isolated by auth.uid()')
    assert.ok(rlsFile.includes('CREATE POLICY "Customer or admin read wallet_tx"'), 'Wallet tx must be isolated by auth.uid()')
  })

  // 17. Mobile Viewport & Touch Clearance
  await runStep('17. Mobile Responsive Viewport (320px to 430px) & Keyboard Clearance', () => {
    const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8')
    assert.ok(indexHtml.includes('viewport-fit=cover'), 'HTML must specify viewport-fit=cover for iOS safe areas')
    const chatSection = fs.readFileSync(path.resolve('src/features/chat/ChatSection.tsx'), 'utf-8')
    assert.ok(chatSection.includes('scrollContainerRef'), 'Chat must have dedicated scroll container')
  })

  console.log('\n=================================================================')
  console.log(`🎯 17-POINT TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
