import type { WeldPackType } from './WeldPackType.ts'

export type UpdateWeldPackDto = {
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
  initialWeldCredits: number
  type: WeldPackType
}
