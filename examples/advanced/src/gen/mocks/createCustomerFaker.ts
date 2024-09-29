import type { Customer } from '../models/ts/Customer.js'
import { createAddressFaker } from './createAddressFaker.js'
import { faker } from '@faker-js/faker'

export function createCustomerFaker(data: NonNullable<Partial<Customer>> = {}) {
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.arrayElements([createAddressFaker()]) as any },
    ...data,
  }
}
