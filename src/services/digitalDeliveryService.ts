import { storeEngine } from './storeEngine'

export type DownloadAccessResult = {
  authorized: boolean
  downloadUrl?: string
  filename?: string
  fileSizeFormatted?: string
  expiresAt?: string
  errorMessage?: string
}

export class DigitalDeliveryService {
  /**
   * Verify customer purchase entitlement and generate short-lived signed delivery token.
   * Unpaid users are strictly blocked.
   */
  static async requestSignedDownload(params: {
    userId: string
    entitlementId: string
    productId: string
    orderId: string
  }): Promise<DownloadAccessResult> {
    try {
      const entitlements = await storeEngine.getCustomerEntitlements(params.userId)
      const entitlement = entitlements.find(
        (e) => e.id === params.entitlementId && e.productId === params.productId && e.isActive,
      )

      if (!entitlement) {
        return {
          authorized: false,
          errorMessage: 'Access denied: No verified purchase entitlement found for this account.',
        }
      }

      // Generate signed URL via store engine
      const downloadUrl = await storeEngine.recordDownload(
        params.entitlementId,
        params.userId,
        params.productId,
        params.orderId,
      )

      const expDate = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })

      const sizeMb = (entitlement.digitalAssetSizeBytes / (1024 * 1024)).toFixed(1) + ' MB'

      return {
        authorized: true,
        downloadUrl,
        filename: entitlement.digitalAssetName,
        fileSizeFormatted: sizeMb,
        expiresAt: expDate,
      }
    } catch (err) {
      return {
        authorized: false,
        errorMessage: err instanceof Error ? err.message : 'Cryptographic authorization failed.',
      }
    }
  }
}
