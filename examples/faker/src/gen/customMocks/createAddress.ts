import { faker } from '@faker-js/faker'
import type { Address } from '../models/Address'

export function createAddress(override: NonNullable<Partial<Address>> = {}): NonNullable<Address> {
  return {
    ...{
      street: faker.string.alpha(),
      city: faker.string.alpha(),
      state: faker.string.alpha(),
      zip: faker.string.alpha(),
      identifier: faker.helpers.arrayElements([faker.number.int(), faker.string.alpha(), faker.helpers.arrayElement<any>(['NW', 'NE', 'SW', 'SE'])]) as any,
    },
    ...override,
  }
}
