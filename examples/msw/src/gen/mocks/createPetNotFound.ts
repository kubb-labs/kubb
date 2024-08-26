import type { PetNotFound } from '../models/PetNotFound'
import { faker } from '@faker-js/faker'

export function createPetNotFound(data: NonNullable<Partial<PetNotFound>> = {}): NonNullable<PetNotFound> {
  faker.seed([220])
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...data,
  }
}
