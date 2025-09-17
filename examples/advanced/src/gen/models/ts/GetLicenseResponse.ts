import type { LicenseType } from './LicenseType.ts'
import type { Reseller } from './Reseller.ts'
import type { Tenant } from './Tenant.ts'

export type GetLicenseResponse = {
  /**
   * @type number
   */
  id: number
  /**
   * @type string, date-time
   */
  activationDate: string | null
  /**
   * @type number
   */
  durationDays: number
  /**
   * @type string, date-time
   */
  lastActivationDate: string | null
  /**
   * @type number
   */
  includedWeldCredits: number
  type: LicenseType
  /**
   * @type boolean
   */
  isDeactivated: boolean
  tenant: Tenant | null
  reseller: Reseller | null
}
