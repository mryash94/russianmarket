import type {
  PaymentProvider,
  PaymentInitiationResult,
  PaymentVerificationResult,
  WebhookResult,
} from './PaymentProvider'
import { supabaseUrl } from '../../lib/supabase'

export class ManualAdminVerificationProvider implements PaymentProvider {
  readonly id = 'admin_concierge'
  readonly displayName = 'Private Concierge Settlement'
  readonly isConfigured = true
  private endpoint = `${supabaseUrl}/functions/v1/quick-responder`

  async initiatePayment(params: {
    orderId: string
    orderNumber: string
    amountMinor: number
    currency: string
    customerEmail: string
    customerName?: string
    idempotencyKey: string
  }): Promise<PaymentInitiationResult> {
    const txId = `CONCIERGE-${params.orderNumber}-${Date.now().toString(36).toUpperCase()}`

    try {
      // Notify edge function of manual settlement initialization
      await fetch(`${this.endpoint}?action=blackx-manual-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'blackx-manual-start',
          payment_reference: params.orderNumber,
          customer_email: params.customerEmail,
          customer_name: params.customerName,
        }),
      }).catch(() => {})
    } catch {
      // Non-blocking fallback
    }

    return {
      success: true,
      transactionId: txId,
      provider: this.id,
      status: 'pending',
      instructions:
        'Order registered under Private Concierge Settlement. Verified administrator review will unlock your digital specimen upon confirmation.',
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    return {
      verified: false,
      transactionId,
      amountMinor: 0,
      currency: 'INR',
      status: 'pending',
      message: 'Awaiting administrator verification in the Admin Control Room.',
    }
  }

  async handleWebhook(): Promise<WebhookResult> {
    return {
      handled: true,
      message: 'Concierge settlement does not require inbound webhooks.',
    }
  }
}
