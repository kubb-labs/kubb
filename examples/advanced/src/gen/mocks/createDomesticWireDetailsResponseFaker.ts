import { faker } from '@faker-js/faker'
import type { DomesticWireDetailsResponse } from '../models/ts/DomesticWireDetailsResponse.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { createPaymentDetailsTypeResponseFaker } from './createPaymentDetailsTypeResponseFaker.ts'

export function createDomesticWireDetailsResponseFaker(_data?: Partial<DomesticWireDetailsResponse>): DomesticWireDetailsResponse {
  return Object.assign(
    {},
    {
      type: createPaymentDetailsTypeResponseFaker(),
      payment_instrument_id: faker.string.alpha(),
      routing_number: faker.string.alpha(),
      account_number: faker.string.alpha(),
      address: createAddressFaker(),
    },
  )
}
