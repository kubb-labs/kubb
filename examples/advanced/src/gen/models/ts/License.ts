import type { LicenseType } from './LicenseType.ts'

export type License = {
  /**
   * @type number
   */
  id: number
  /**
   * @type string, date-time
   */
  activationDate: string | null
  /**
   * @type integer
   */
  durationDays: number
  /**
   * @type string, date-time
   */
  lastActivationDate: string | null
  /**
   * @type integer
   */
  includedWeldCredits: number
  type: LicenseType
  /**
   * @type boolean
   */
  isDeactivated: boolean
  /**
   * @type string, date-time
   */
  expirationDate: string
  /**
   * @type boolean
   */
  isActive: boolean
}
