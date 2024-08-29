import type { Customer } from '../models/Customer'
import { createAddress } from './createAddress.ts'
import { faker } from '@faker-js/faker'

export function createCustomer(data: NonNullable<Partial<Customer>> = {}): NonNullable<Customer> {
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.arrayElements([createAddress()]) as any },
    ...data,
  }
}
