import type { Customer } from '../models/ts/customer.ts'
import { createAddressFaker } from './addressFaker.ts'
import { faker } from '@faker-js/faker'

export function createCustomerFaker(data?: Partial<Customer>): Customer {
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.multiple(() => createAddressFaker()) },
    ...(data || {}),
  }
}
