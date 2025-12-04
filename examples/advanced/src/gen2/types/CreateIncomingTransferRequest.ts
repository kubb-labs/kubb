import type { CounterPartyIncomingTransfer } from './CounterPartyIncomingTransfer.ts'
import type { Money } from './Money.ts'
import type { ReceivingAccount } from './ReceivingAccount.ts'

export type CreateIncomingTransferRequest = {
  /**
   * @description Counterparty Details for the transfer
   * @type object
   */
  counterparty: CounterPartyIncomingTransfer
  /**
   * @description Receiving account details for the transfer
   * @type object
   */
  receiving_account: ReceivingAccount
  /**
   * @description \nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n
   * @type object
   */
  amount: Money
  /**
   * @description  \nDescription of the transfer for internal use. Not exposed externally. \n
   * @type string
   */
  description: string
}
