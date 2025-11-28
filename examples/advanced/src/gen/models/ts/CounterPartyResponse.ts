import type { VendorDetailsResponse } from './VendorDetailsResponse.ts'

/**
 * @description Counterparty Details for the transfer - Currently only supports vendors that are returned in the \nresponse from the /vendors endpoint\nBOOK_TRANSFER is a limited feature. Please reach out if you are interested.\n
 */
export type CounterPartyResponse = VendorDetailsResponse & {
  type: 'VENDOR'
}
