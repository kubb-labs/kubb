import type { CounterPartyResponseType } from './CounterPartyResponseType.ts'

export type BookTransferDetailsResponse = {
  /**
   * @type string
   */
  type: CounterPartyResponseType
  /**
   * @description This feature is currently limited to certain customers, please reach out if you are interested
   * @type string
   */
  deposit_account_id: string
}
