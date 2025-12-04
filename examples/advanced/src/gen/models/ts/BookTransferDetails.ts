import type { CounterPartyType } from './CounterPartyType.ts'
import type { Recipient } from './Recipient.ts'

export type BookTransferDetails = {
  /**
   * @type string
   */
  type: CounterPartyType
  /**
   * @type object
   */
  recipient: Recipient
}
