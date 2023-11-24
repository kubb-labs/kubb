import { PetNotFound } from '../models/PetNotFound'
import { faker } from '@faker-js/faker'

export function createPetNotFound(): NonNullable<PetNotFound> {
  return { 'code': faker.number.float({}), 'message': faker.string.alpha() }
}
