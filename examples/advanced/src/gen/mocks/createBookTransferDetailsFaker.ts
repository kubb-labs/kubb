import type { BookTransferDetails } from '../models/ts/BookTransferDetails.ts'
import { createCounterPartyTypeFaker } from './createCounterPartyTypeFaker.ts'
import { createRecipientFaker } from './createRecipientFaker.ts'

export function createBookTransferDetailsFaker(data?: Partial<BookTransferDetails>): BookTransferDetails {
  return Object.assign({}, { type: createCounterPartyTypeFaker(), recipient: createRecipientFaker() })
}
