import type { OrderStatus } from '../../types/database'

export type PaymentInitiationResult = {
  success: boolean
  transactionId: string
  provider: string
  status: OrderStatus
  paymentUrl?: string
  instructions?: string
  errorMessage?: string
}

export type PaymentVerificationResult = {
  verified: boolean
  transactionId: string
  providerReference?: string
  amountMinor: number
  currency: string
  status: OrderStatus
  message?: string
}

export type WebhookResult = {
  handled: boolean
  orderId?: string
  newStatus?: OrderStatus
  message: string
}

export interface PaymentProvider {
  readonly id: string
  readonly displayName: string
  readonly isConfigured: boolean

  initiatePayment(params: {
    orderId: string
    orderNumber: string
    amountMinor: number
    currency: string
    customerEmail: string
    customerName?: string
    idempotencyKey: string
  }): Promise<PaymentInitiationResult>

  verifyPayment(transactionId: string): Promise<PaymentVerificationResult>

  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>
}
