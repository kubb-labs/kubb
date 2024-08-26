import type { Address } from '../models/Address'
import { faker } from '@faker-js/faker'

export function createAddress(data: NonNullable<Partial<Address>> = {}): NonNullable<Address> {
  faker.seed([220])
  return {
    ...{ street: faker.string.alpha(), city: faker.string.alpha(), state: faker.string.alpha(), zip: faker.string.alpha() },
    ...data,
  }
}
