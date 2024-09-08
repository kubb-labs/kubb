import type { Customer } from '../models/Customer.ts'
import { createAddress } from './createAddress.ts'
import { faker } from '@faker-js/faker'

export function createCustomer(data: NonNullable<Partial<Customer>> = {}) {
  faker.seed([220])
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.arrayElements([createAddress()]) as any },
    ...data,
  }
}
