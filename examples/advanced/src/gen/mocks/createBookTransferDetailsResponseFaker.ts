import type { BookTransferDetailsResponse } from '../models/ts/BookTransferDetailsResponse.ts'
import { createCounterPartyResponseTypeFaker } from './createCounterPartyResponseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createBookTransferDetailsResponseFaker(data?: Partial<BookTransferDetailsResponse>): BookTransferDetailsResponse {
  return Object.assign({}, { type: createCounterPartyResponseTypeFaker(), deposit_account_id: faker.string.alpha() })
}
