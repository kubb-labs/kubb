import type { OriginatingAccountResponseType } from './OriginatingAccountResponseType.ts'

export type BrexCashAccountDetailsResponse = {
  /**
   * @type string
   */
  type: OriginatingAccountResponseType
  /**
   * @description \nID of the Brex Business account.\n
   * @type string
   */
  id: string
}
