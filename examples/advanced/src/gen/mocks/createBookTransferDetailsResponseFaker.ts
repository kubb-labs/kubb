import type { BookTransferDetailsResponse } from '../models/ts/BookTransferDetailsResponse.ts'
import { createCounterPartyResponseFaker } from './createCounterPartyResponseFaker.ts'
import { createCounterPartyResponseTypeFaker } from './createCounterPartyResponseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createBookTransferDetailsResponseFaker(data?: Partial<BookTransferDetailsResponse>): BookTransferDetailsResponse {
  return Object.assign({}, Object.assign({}, createCounterPartyResponseFaker(), { type: 'BOOK_TRANSFER' }), {
    type: createCounterPartyResponseTypeFaker(),
    deposit_account_id: faker.string.alpha(),
  })
}
