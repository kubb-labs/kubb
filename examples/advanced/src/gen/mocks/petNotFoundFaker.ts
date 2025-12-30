import type { PetNotFound } from '../models/ts/petNotFound.ts'
import { faker } from '@faker-js/faker'

export function createPetNotFoundFaker(data?: Partial<PetNotFound>): PetNotFound {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}
