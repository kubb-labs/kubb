import type { PetNotFound } from '../models/PetNotFound.ts'
import { faker } from '@faker-js/faker'

export function createPetNotFound(data?: Partial<PetNotFound>): PetNotFound {
  faker.seed([220])
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}
