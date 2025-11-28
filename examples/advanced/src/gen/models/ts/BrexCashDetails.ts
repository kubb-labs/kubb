import type { ReceivingAccountType } from './ReceivingAccountType.ts'

export type BrexCashDetails = {
  /**
   * @type string
   */
  type: ReceivingAccountType
  /**
   * @description \nID of the Brex business account: Can be found from the [List business accounts](/openapi/transactions_api/#operation/listAccounts) endpoint\n
   * @type string
   */
  id: string
}
