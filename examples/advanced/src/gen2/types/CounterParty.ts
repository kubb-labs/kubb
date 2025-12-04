import type { BookTransferDetails } from './BookTransferDetails.ts'
import type { VendorDetails } from './VendorDetails.ts'

/**
 * @description Counterparty Details for the transfer
 */
export type CounterParty = VendorDetails | BookTransferDetails
