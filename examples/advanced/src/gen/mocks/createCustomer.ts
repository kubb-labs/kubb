import { createAddress } from './createAddress'
import { faker } from '@faker-js/faker'
import type { Customer } from '../models/ts/Customer'

export function createCustomer(data: NonNullable<Partial<Customer>> = {}): NonNullable<Customer> {
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.arrayElements([createAddress()]) as any },
    ...data,
  }
}
