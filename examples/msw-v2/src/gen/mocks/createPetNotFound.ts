import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/PetNotFound'

export function createPetNotFound(override: NonNullable<Partial<PetNotFound>> = {}): NonNullable<PetNotFound> {
  faker.seed([220])
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...override,
  }
}
