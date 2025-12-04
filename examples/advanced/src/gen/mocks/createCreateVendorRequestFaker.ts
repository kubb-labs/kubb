import { faker } from '@faker-js/faker'
import type { CreateVendorRequest } from '../models/ts/CreateVendorRequest.ts'
import { createPaymentAccountRequestFaker } from './createPaymentAccountRequestFaker.ts'

export function createCreateVendorRequestFaker(data?: Partial<CreateVendorRequest>): CreateVendorRequest {
  return {
    ...{
      company_name: faker.string.alpha(),
      email: faker.internet.email(),
      phone: faker.string.alpha(),
      payment_accounts: faker.helpers.multiple(() => createPaymentAccountRequestFaker()),
    },
    ...(data || {}),
  }
}
