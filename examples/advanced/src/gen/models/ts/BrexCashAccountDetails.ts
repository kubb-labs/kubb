import type { OriginatingAccountType } from './OriginatingAccountType.ts'

export type BrexCashAccountDetails = {
  /**
   * @type string
   */
  type: OriginatingAccountType
  /**
   * @description \nID of the Brex Business account: Can be found from the `/accounts` endpoint\nwhere instrument type is `CASH`.\n
   * @type string
   */
  id: string
}
