import { faker } from '@faker-js/faker'
import type { Address } from '../models/ts/Address.ts'

export function createAddressFaker(data?: Partial<Address>): Address {
  return {
    ...{ street: faker.string.alpha(), city: faker.string.alpha(), state: faker.string.alpha(), zip: faker.string.alpha() },
    ...(data || {}),
  }
}
