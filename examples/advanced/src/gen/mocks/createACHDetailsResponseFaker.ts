import type { ACHDetailsResponse } from '../models/ts/ACHDetailsResponse.ts'
import { createAccountClassFaker } from './createAccountClassFaker.ts'
import { createAccountTypeFaker } from './createAccountTypeFaker.ts'
import { createPaymentDetailsTypeResponseFaker } from './createPaymentDetailsTypeResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createACHDetailsResponseFaker(data?: Partial<ACHDetailsResponse>): ACHDetailsResponse {
  return Object.assign(
    {},
    {
      type: createPaymentDetailsTypeResponseFaker(),
      payment_instrument_id: faker.string.alpha(),
      routing_number: faker.string.alpha(),
      account_number: faker.string.alpha(),
      account_type: Object.assign({}, createAccountTypeFaker()),
      account_class: Object.assign({}, createAccountClassFaker()),
    },
  )
}
