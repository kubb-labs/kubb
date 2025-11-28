import type { BookTransferDetails } from './BookTransferDetails.ts'
import type { VendorDetails } from './VendorDetails.ts'

/**
 * @description Counterparty Details for the transfer
 */
export type CounterParty =
  | (BookTransferDetails & {
      type: 'BOOK_TRANSFER'
    })
  | (VendorDetails & {
      type: 'VENDOR'
    })
