import type { Reseller } from '../models/ts/Reseller.ts'
import { faker } from '@faker-js/faker'

export function createResellerFaker(data?: Partial<Reseller>): Reseller {
  return {
    ...{ id: faker.number.float(), name: faker.string.alpha() },
    ...(data || {}),
  }
}
