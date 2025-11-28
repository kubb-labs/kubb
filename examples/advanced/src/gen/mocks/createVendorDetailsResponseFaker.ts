import type { VendorDetailsResponse } from '../models/ts/VendorDetailsResponse.ts'
import { createCounterPartyResponseTypeFaker } from './createCounterPartyResponseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createVendorDetailsResponseFaker(data?: Partial<VendorDetailsResponse>): VendorDetailsResponse {
  return Object.assign(
    {},
    {
      type: createCounterPartyResponseTypeFaker(),
      payment_instrument_id: faker.string.alpha(),
      id: faker.string.alpha(),
      routing_number: faker.string.alpha(),
      account_number: faker.string.alpha(),
    },
  )
}
