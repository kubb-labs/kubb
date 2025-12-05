import type { BookTransferDetails } from '../models/ts/BookTransferDetails.ts'
import { createCounterPartyTypeFaker } from './createCounterPartyTypeFaker.ts'
import { createRecipientFaker } from './createRecipientFaker.ts'

export function createBookTransferDetailsFaker(_data?: Partial<BookTransferDetails>): BookTransferDetails {
  return Object.assign({}, { type: createCounterPartyTypeFaker(), recipient: createRecipientFaker() })
}
