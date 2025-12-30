import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/ts/petNotFound.ts'

export function createPetNotFoundFaker(data?: Partial<PetNotFound>): PetNotFound {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}
