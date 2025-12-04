import type { ApprovalType } from './ApprovalType.ts'
import type { CounterParty } from './CounterParty.ts'
import type { Money } from './Money.ts'
import type { OriginatingAccount } from './OriginatingAccount.ts'

export type CreateTransferRequest = {
  /**
   * @description Counterparty Details for the transfer
   * @type object
   */
  counterparty: CounterParty
  /**
   * @description \nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n
   * @type object
   */
  amount: Money
  /**
   * @description Description of the transfer for internal use. Not exposed externally.
   * @type string
   */
  description: string
  /**
   * @description External memo for the transfer. `Payment Instructions` for Wires and the `Entry Description` for ACH payments. \nMust be at most 90 characters for `ACH` and `WIRE` transactions\nand at most 40 characters for `CHEQUES`\n
   * @maxLength 90
   * @type string
   */
  external_memo: string
  originating_account: OriginatingAccount & any
  approval_type?: ApprovalType | null
  /**
   * @description When set to true, add Principal Protection (PPRO) to the transaction.\n PPRO means Brex will cover any fees charged by intemediary or receiving banks. PPRO charges will be billed separately\n in a monthly statement. PPRO is only available for international wire transactions.\n
   * @type boolean | undefined
   */
  is_ppro_enabled?: boolean
}
