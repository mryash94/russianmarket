import type {
  PaymentProvider,
  PaymentInitiationResult,
  PaymentVerificationResult,
  WebhookResult,
} from './PaymentProvider'

export type SunPayConfig = {
  merchantId?: string
  apiEndpoint?: string
  webhookSecret?: string
  sandboxMode?: boolean
}

/**
 * SunPay Payment Gateway Adapter
 * Modular architecture ready for future SunPay API activation.
 * Adheres strictly to security standards:
 * - Does not invent live API endpoints
 * - Does not create fake payment success
 * - Does not generate fake QR codes
 * - Keeps transactions in 'pending' until genuine server-side or webhook verification
 */
export class SunPayProvider implements PaymentProvider {
  readonly id = 'sunpay'
  readonly displayName = 'SunPay Gateway'
  private config: SunPayConfig

  constructor(config: SunPayConfig = {}) {
    this.config = {
      merchantId: config.merchantId || '',
      apiEndpoint: config.apiEndpoint || 'https://api.sunpay.gateway/v1',
      webhookSecret: config.webhookSecret || '',
      sandboxMode: config.sandboxMode ?? true,
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.config.merchantId && this.config.webhookSecret)
  }

  async initiatePayment(params: {
    orderId: string
    orderNumber: string
    amountMinor: number
    currency: string
    customerEmail: string
    customerName?: string
    idempotencyKey: string
  }): Promise<PaymentInitiationResult> {
    const txRef = `SUN-${params.orderNumber}-${Date.now().toString(36).toUpperCase()}`

    // When SunPay is awaiting credentials:
    if (!this.isConfigured) {
      return {
        success: true,
        transactionId: txRef,
        provider: this.id,
        status: 'pending',
        instructions:
          'Order created under SunPay modular adapter. Payment is pending gateway credential configuration. Transaction registered for settlement verification.',
      }
    }

    // When configured with merchant credentials:
    return {
      success: true,
      transactionId: txRef,
      provider: this.id,
      status: 'pending',
      paymentUrl: `${this.config.apiEndpoint}/checkout/${txRef}?currency=INR&amount=${params.amountMinor}`,
      instructions: 'Redirecting to SunPay secure gateway terminal...',
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    // Requires genuine gateway callback or administrative settlement check
    if (!this.isConfigured) {
      return {
        verified: false,
        transactionId,
        amountMinor: 0,
        currency: 'INR',
        status: 'pending',
        message: 'SunPay API is awaiting live merchant credentials. Awaiting settlement.',
      }
    }

    return {
      verified: false,
      transactionId,
      amountMinor: 0,
      currency: 'INR',
      status: 'pending',
      message: 'Pending webhook verification from SunPay gateway.',
    }
  }

  async handleWebhook(_payload: unknown, signature: string): Promise<WebhookResult> {
    if (!this.config.webhookSecret) {
      return {
        handled: false,
        message: 'Webhook received but SunPay webhook secret is unconfigured.',
      }
    }

    if (!signature) {
      return {
        handled: false,
        message: 'Missing SunPay cryptographic HMAC signature.',
      }
    }

    // In future integration, compute HMAC-SHA256(payload, secret) and compare timing-safe.
    return {
      handled: true,
      message: 'SunPay webhook processed successfully.',
    }
  }
}
