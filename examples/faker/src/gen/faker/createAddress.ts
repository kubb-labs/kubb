import type { Address } from '../models/Address.ts'
import { faker } from '@faker-js/faker'

export function createAddress(data?: Partial<Address>): Address {
  return {
    ...{
      street: faker.string.alpha(),
      city: faker.string.alpha(),
      state: faker.string.alpha(),
      zip: faker.string.alpha(),
      identifier: faker.helpers.arrayElements([faker.number.int(), faker.string.alpha(), faker.helpers.arrayElement<any>(['NW', 'NE', 'SW', 'SE'])]) as any,
    },
    ...(data || {}),
  }
}
