import type { ChequeDetailsResponse } from '../models/ts/ChequeDetailsResponse.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { createPaymentDetailsTypeResponseFaker } from './createPaymentDetailsTypeResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createChequeDetailsResponseFaker(data?: Partial<ChequeDetailsResponse>): ChequeDetailsResponse {
  return Object.assign(
    {},
    {
      type: createPaymentDetailsTypeResponseFaker(),
      payment_instrument_id: faker.string.alpha(),
      mailing_address: createAddressFaker(),
      recipient_name: faker.string.alpha(),
    },
  )
}
