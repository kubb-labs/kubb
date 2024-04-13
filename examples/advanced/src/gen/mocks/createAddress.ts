import { faker } from '@faker-js/faker'
import type { Address } from '../models/ts/Address'

export function createAddress(data: NonNullable<Partial<Address>> = {}): NonNullable<Address> {
  return {
    ...{ street: faker.string.alpha(), city: faker.string.alpha(), state: faker.string.alpha(), zip: faker.string.alpha() },
    ...data,
  }
}
