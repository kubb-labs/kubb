import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/ts/PetNotFound'

export function createPetNotFound(): NonNullable<PetNotFound> {
  return { 'code': faker.number.float({}), 'message': faker.string.alpha() }
}
