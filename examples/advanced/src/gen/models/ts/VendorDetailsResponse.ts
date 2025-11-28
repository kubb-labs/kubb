import type { CounterPartyResponseType } from './CounterPartyResponseType.ts'

export type VendorDetailsResponse = {
  /**
   * @type string
   */
  type: CounterPartyResponseType
  /**
   * @type string
   */
  payment_instrument_id: string
  /**
   * @description Vendor ID returned from `/vendors` endpoint
   * @type string
   */
  id: string
  /**
   * @description Routing number of a bank account (or SWIFT/BIC code for international transfer).
   * @type string
   */
  routing_number?: string | null
  /**
   * @description Account number of a bank account (or IBAN code for international transfer).
   * @type string
   */
  account_number?: string | null
}
