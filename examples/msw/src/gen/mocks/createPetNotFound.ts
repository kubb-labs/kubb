import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/PetNotFound'

export function createPetNotFound(override: NonNullable<Partial<PetNotFound>> = {}): NonNullable<PetNotFound> {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...override,
  }
}
