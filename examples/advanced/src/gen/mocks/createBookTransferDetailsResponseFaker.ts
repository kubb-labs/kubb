import { faker } from '@faker-js/faker'
import type { BookTransferDetailsResponse } from '../models/ts/BookTransferDetailsResponse.ts'
import { createCounterPartyResponseTypeFaker } from './createCounterPartyResponseTypeFaker.ts'

export function createBookTransferDetailsResponseFaker(_data?: Partial<BookTransferDetailsResponse>): BookTransferDetailsResponse {
  return Object.assign({}, { type: createCounterPartyResponseTypeFaker(), deposit_account_id: faker.string.alpha() })
}
