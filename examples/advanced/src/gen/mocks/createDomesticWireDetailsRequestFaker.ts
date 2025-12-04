import { faker } from '@faker-js/faker'
import type { DomesticWireDetailsRequest } from '../models/ts/DomesticWireDetailsRequest.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { createPaymentDetailsTypeRequestFaker } from './createPaymentDetailsTypeRequestFaker.ts'

export function createDomesticWireDetailsRequestFaker(_data?: Partial<DomesticWireDetailsRequest>): DomesticWireDetailsRequest {
  return Object.assign(
    {},
    {
      type: createPaymentDetailsTypeRequestFaker(),
      routing_number: faker.string.alpha(),
      account_number: faker.string.alpha(),
      address: createAddressFaker(),
      beneficiary_name: faker.string.alpha(),
    },
  )
}
