import type { PetNotFound } from '../models/ts/PetNotFound.js'
import { faker } from '@faker-js/faker'

export function createPetNotFoundFaker(data: NonNullable<Partial<PetNotFound>> = {}) {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...data,
  }
}
