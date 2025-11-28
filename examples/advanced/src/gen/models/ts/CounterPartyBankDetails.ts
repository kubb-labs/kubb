import type { CounterPartyIncomingTransferType } from './CounterPartyIncomingTransferType.ts'

export type CounterPartyBankDetails = {
  /**
   * @type string
   */
  type: CounterPartyIncomingTransferType
  /**
   * @description \nThe financial account id: Can be found from the [List linked accounts](/openapi/payments_api/#operation/listLinkedAccounts) endpoint\n
   * @type string
   */
  id: string
}
