import type { Address } from '../models/Address.ts'
import { faker } from '@faker-js/faker'

export function createAddress(data?: Partial<Address>): Address {
  faker.seed([220])
  return {
    ...{ street: faker.string.alpha(), city: faker.string.alpha(), state: faker.string.alpha(), zip: faker.string.alpha() },
    ...(data || {}),
  }
}
