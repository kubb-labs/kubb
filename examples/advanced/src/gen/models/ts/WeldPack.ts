import type { Tenant } from './Tenant.ts'
import type { WeldPackType } from './WeldPackType.ts'

export type WeldPack = {
  /**
   * @type number
   */
  id: number
  /**
   * @type number
   */
  initialWeldCredits: number
  /**
   * @type number
   */
  consumedWeldCredits: number
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
  type: WeldPackType
  /**
   * @type boolean
   */
  isDeactivated: boolean
  tenant: Tenant | null
  /**
   * @type string, date-time
   */
  expirationDate: string
  /**
   * @type boolean
   */
  isActive: boolean
}
