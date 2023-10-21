import { faker } from '@faker-js/faker'

import { Customer } from '../models/ts/Customer'
import { createAddress } from './createAddress'

export function createCustomer(): NonNullable<Customer> {
  return { id: faker.number.float({}), username: faker.string.alpha(), address: faker.helpers.arrayElements([createAddress()]) as any }
}
