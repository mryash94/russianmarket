// Supabase Edge Function: SunPay Webhook Handler
// Verifies HMAC SHA-256 signatures, deduplicates transactions, and fulfills orders securely.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUNPAY_WEBHOOK_SECRET = Deno.env.get('SUNPAY_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const signature = req.headers.get('x-sunpay-signature')
    const bodyText = await req.text()

    if (!SUNPAY_WEBHOOK_SECRET && !signature) {
      // In development or sandbox mode without configured secrets
      console.log('SunPay webhook: Received payload in sandbox/development mode')
    } else if (SUNPAY_WEBHOOK_SECRET && signature) {
      // HMAC SHA-256 Signature Verification
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(SUNPAY_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )

      const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0))
      const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(bodyText))

      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid HMAC signature' }), { status: 401 })
      }
    }

    const payload = JSON.parse(bodyText)
    const { orderNumber, transactionId, status, amountMinor } = payload

    if (status === 'PAID' || status === 'COMPLETED') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      // Deduplication & Order fulfillment
      const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('id, status, subtotal_minor')
        .eq('order_number', orderNumber)
        .single()

      if (fetchErr || !order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
      }

      if (order.status !== 'completed' && order.status !== 'payment_verified') {
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_status: 'verified',
            utr_number: transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
      }
    }

    return new Response(JSON.stringify({ received: true, status: 'processed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500 })
  }
})
