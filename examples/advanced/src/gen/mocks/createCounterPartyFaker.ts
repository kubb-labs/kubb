import type { CounterParty } from '../models/ts/CounterParty.ts'
import { createBookTransferDetailsFaker } from './createBookTransferDetailsFaker.ts'
import { createVendorDetailsFaker } from './createVendorDetailsFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Counterparty Details for the transfer
 */
export function createCounterPartyFaker(data?: Partial<CounterParty>): CounterParty {
  return (
    data ||
    faker.helpers.arrayElement<any>([
      Object.assign({}, createBookTransferDetailsFaker(), { type: 'BOOK_TRANSFER' }),
      Object.assign({}, createVendorDetailsFaker(), { type: 'VENDOR' }),
    ])
  )
}
