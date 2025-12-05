import type { Address } from './Address.ts'
import type { PaymentDetailsTypeRequest } from './PaymentDetailsTypeRequest.ts'

export type ChequeDetailsRequest = {
  /**
   * @type string
   */
  type: PaymentDetailsTypeRequest
  /**
   * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
   * @type object
   */
  mailing_address: Address
  /**
   * @maxLength 40
   * @type string
   */
  recipient_name: string
  /**
   * @type string
   */
  beneficiary_name?: string | null
}
