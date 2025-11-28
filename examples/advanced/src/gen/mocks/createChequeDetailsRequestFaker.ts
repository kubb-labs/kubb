import type { ChequeDetailsRequest } from '../models/ts/ChequeDetailsRequest.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { createPaymentDetailsTypeRequestFaker } from './createPaymentDetailsTypeRequestFaker.ts'
import { faker } from '@faker-js/faker'

export function createChequeDetailsRequestFaker(data?: Partial<ChequeDetailsRequest>): ChequeDetailsRequest {
  return Object.assign(
    {},
    {
      type: createPaymentDetailsTypeRequestFaker(),
      mailing_address: createAddressFaker(),
      recipient_name: faker.string.alpha({ length: 40 }),
      beneficiary_name: faker.string.alpha(),
    },
  )
}
