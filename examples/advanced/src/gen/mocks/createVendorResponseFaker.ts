import type { VendorResponse } from '../models/ts/VendorResponse.ts'
import { createPaymentAccountResponseFaker } from './createPaymentAccountResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createVendorResponseFaker(data?: Partial<VendorResponse>): VendorResponse {
  return {
    ...{
      id: faker.string.alpha(),
      company_name: faker.string.alpha(),
      email: faker.string.alpha(),
      phone: faker.string.alpha(),
      payment_accounts: faker.helpers.multiple(() => createPaymentAccountResponseFaker()),
    },
    ...(data || {}),
  }
}
