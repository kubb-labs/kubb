import type { WeldPackType } from './WeldPackType.ts'

export type CreateWeldPackDto = {
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
   * @type integer
   */
  initialWeldCredits: number
  type: WeldPackType
}
