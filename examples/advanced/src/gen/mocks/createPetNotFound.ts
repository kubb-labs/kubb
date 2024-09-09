import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import { faker } from '@faker-js/faker'

export function createPetNotFound(data: NonNullable<Partial<PetNotFound>> = {}) {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...data,
  }
}
