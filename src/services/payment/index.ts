import { SunPayProvider } from './SunPayProvider'
import { ManualAdminVerificationProvider } from './ManualAdminVerificationProvider'
import type { PaymentProvider } from './PaymentProvider'

export * from './PaymentProvider'
export * from './SunPayProvider'
export * from './ManualAdminVerificationProvider'

export class PaymentGatewayService {
  private static providers: Map<string, PaymentProvider> = new Map<string, PaymentProvider>([
    ['sunpay', new SunPayProvider() as PaymentProvider],
    ['admin_concierge', new ManualAdminVerificationProvider() as PaymentProvider],
  ])

  static getProvider(providerId: string): PaymentProvider {
    const provider = this.providers.get(providerId)
    if (!provider) {
      return this.providers.get('sunpay')!
    }
    return provider
  }

  static getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.providers.values())
  }

  static configureSunPay(config: {
    merchantId?: string
    apiEndpoint?: string
    webhookSecret?: string
    sandboxMode?: boolean
  }) {
    this.providers.set('sunpay', new SunPayProvider(config))
  }
}
