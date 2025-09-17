import type { LicenseType } from './LicenseType.ts'

export type UpdateLicenseDto = {
  /**
   * @type number
   */
  resellerId: number
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
}
