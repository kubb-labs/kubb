import { faker } from '@faker-js/faker'
import type { Address } from '../models/ts/Address.ts'

/**
 * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
 */
export function createAddressFaker(data?: Partial<Address>): Address {
  return {
    ...{
      line1: faker.string.alpha(),
      line2: faker.string.alpha(),
      city: faker.string.alpha(),
      state: faker.string.alpha(),
      country: faker.string.alpha(),
      postal_code: faker.string.alpha(),
      phone_number: faker.string.alpha(),
    },
    ...(data || {}),
  }
}
