import type { AccountClass } from './AccountClass.ts'
import type { AccountType } from './AccountType.ts'
import type { PaymentDetailsTypeResponse } from './PaymentDetailsTypeResponse.ts'

export type ACHDetailsResponse = {
  /**
   * @type string
   */
  type: PaymentDetailsTypeResponse
  /**
   * @description Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n
   * @type string
   */
  payment_instrument_id: string
  /**
   * @type string
   */
  routing_number: string
  /**
   * @type string
   */
  account_number: string
  account_type?: AccountType | null
  account_class?: AccountClass | null
}
