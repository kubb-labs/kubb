import type { Address } from './Address.ts'
import type { PaymentDetailsTypeResponse } from './PaymentDetailsTypeResponse.ts'

export type ChequeDetailsResponse = {
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
   * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
   * @type object
   */
  mailing_address: Address
  /**
   * @type string
   */
  recipient_name: string
}
