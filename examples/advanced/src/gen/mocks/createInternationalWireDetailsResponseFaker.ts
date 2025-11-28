import type { InternationalWireDetailsResponse } from '../models/ts/InternationalWireDetailsResponse.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { createPaymentDetailsTypeResponseFaker } from './createPaymentDetailsTypeResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createInternationalWireDetailsResponseFaker(data?: Partial<InternationalWireDetailsResponse>): InternationalWireDetailsResponse {
  return Object.assign(
    {},
    {
      type: createPaymentDetailsTypeResponseFaker(),
      payment_instrument_id: faker.string.alpha(),
      swift_code: faker.string.alpha(),
      iban: faker.string.alpha(),
      beneficiary_bank_name: faker.string.alpha(),
      address: createAddressFaker(),
    },
  )
}
