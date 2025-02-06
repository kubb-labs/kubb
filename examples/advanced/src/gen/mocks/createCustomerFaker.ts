import type { Customer } from '../models/ts/Customer.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { faker } from '@faker-js/faker'

export function createCustomerFaker(data?: Partial<Customer>): Partial<Customer> {
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.multiple(() => createAddressFaker()) as any },
    ...(data || {}),
  }
}
