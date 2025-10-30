import { faker } from '@faker-js/faker'
import type { Customer } from '../models/ts/Customer.ts'
import { createAddressFaker } from './createAddressFaker.ts'

export function createCustomerFaker(data?: Partial<Customer>): Customer {
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.multiple(() => createAddressFaker()) },
    ...(data || {}),
  }
}
