import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/ts/PetNotFound'

export function createPetNotFound(data: NonNullable<Partial<PetNotFound>> = {}): NonNullable<PetNotFound> {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...data,
  }
}
