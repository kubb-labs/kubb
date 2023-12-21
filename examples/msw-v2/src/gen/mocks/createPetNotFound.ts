import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/PetNotFound'

export function createPetNotFound(): NonNullable<PetNotFound> {
  faker.seed([220])
  return { 'code': faker.number.float({}), 'message': faker.string.alpha() }
}
