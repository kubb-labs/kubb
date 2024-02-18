import { faker } from '@faker-js/faker'
import type { Address } from '../models/Address'

export function createAddress(override: NonNullable<Partial<Address>> = {}): NonNullable<Address> {
  faker.seed([220])
  return {
    ...{ 'street': faker.string.alpha(), 'city': faker.string.alpha(), 'state': faker.string.alpha(), 'zip': faker.string.alpha() },
    ...override,
  }
}
