import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/ts/PetNotFound.ts'

export function createPetNotFoundFaker(data?: Partial<PetNotFound>) {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  } as PetNotFound
}
