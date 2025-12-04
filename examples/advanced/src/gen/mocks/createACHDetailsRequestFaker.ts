import { faker } from '@faker-js/faker'
import type { ACHDetailsRequest } from '../models/ts/ACHDetailsRequest.ts'
import { createAccountClassFaker } from './createAccountClassFaker.ts'
import { createAccountTypeFaker } from './createAccountTypeFaker.ts'
import { createPaymentDetailsTypeRequestFaker } from './createPaymentDetailsTypeRequestFaker.ts'

export function createACHDetailsRequestFaker(_data?: Partial<ACHDetailsRequest>): ACHDetailsRequest {
  return Object.assign(
    {},
    {
      type: createPaymentDetailsTypeRequestFaker(),
      routing_number: faker.string.alpha(),
      account_number: faker.string.alpha(),
      account_type: createAccountTypeFaker(),
      account_class: createAccountClassFaker(),
      beneficiary_name: faker.string.alpha(),
    },
  )
}
