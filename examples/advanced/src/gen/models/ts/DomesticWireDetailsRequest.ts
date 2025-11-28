import type { Address } from './Address.ts'
import type { PaymentDetailsTypeRequest } from './PaymentDetailsTypeRequest.ts'

export type DomesticWireDetailsRequest = {
  /**
   * @type string
   */
  type: PaymentDetailsTypeRequest
  /**
   * @description The routing number must follow proper format.
   * @type string
   */
  routing_number: string
  /**
   * @type string
   */
  account_number: string
  /**
   * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
   * @type object
   */
  address: Address
  /**
   * @type string
   */
  beneficiary_name?: string | null
}
