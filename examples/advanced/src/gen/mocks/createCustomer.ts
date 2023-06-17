import { faker } from '@faker-js/faker'

import { createAddress as createAddress4 } from './createAddress'
import { Customer } from '../models/ts/Customer'

export function createCustomer(): Customer {
  return { id: faker.number.float({}), username: faker.string.alpha(), address: faker.helpers.arrayElements([createAddress4()]) as any }
}
