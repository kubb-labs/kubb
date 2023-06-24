import { faker } from '@faker-js/faker'

import { createAddress as createAddress1 } from './createAddress'
import { Customer } from '../models/ts/Customer'

export function createCustomer(): Customer {
  return { id: faker.number.float({}), username: faker.string.alpha(), address: faker.helpers.arrayElements([createAddress1()]) as any }
}
