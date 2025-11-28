import type { UpdateVendorRequest } from '../models/ts/UpdateVendorRequest.ts'
import { createPaymentAccountRequestFaker } from './createPaymentAccountRequestFaker.ts'
import { faker } from '@faker-js/faker'

export function createUpdateVendorRequestFaker(data?: Partial<UpdateVendorRequest>): UpdateVendorRequest {
  return {
    ...{
      company_name: faker.string.alpha(),
      email: faker.internet.email(),
      phone: faker.string.alpha(),
      payment_accounts: faker.helpers.multiple(() => createPaymentAccountRequestFaker()),
      beneficiary_name: faker.string.alpha(),
    },
    ...(data || {}),
  }
}
