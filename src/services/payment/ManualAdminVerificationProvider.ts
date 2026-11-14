import type {
  PaymentProvider,
  PaymentInitiationResult,
  PaymentVerificationResult,
  WebhookResult,
} from './PaymentProvider'

export class ManualAdminVerificationProvider implements PaymentProvider {
  readonly id = 'admin_concierge'
  readonly displayName = 'Private Concierge Settlement'
  readonly isConfigured = true

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
    return {
      success: true,
      transactionId: txId,
      provider: this.id,
      status: 'pending',
      instructions:
        'Order submitted to Russian Market Concierge. Deliverable assets will be verified and delivered to your Orders as soon as settlement is confirmed.',
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    return {
      verified: false,
      transactionId,
      amountMinor: 0,
      currency: 'USD',
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
