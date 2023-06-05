import { faker } from '@faker-js/faker'

import { createAddress } from './createAddress'

export function createCustomer() {
  return { id: faker.number.float({}), username: faker.string.alpha({}), address: faker.helpers.arrayElement([createAddress()]) }
}
