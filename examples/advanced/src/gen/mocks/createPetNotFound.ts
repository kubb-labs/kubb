import { faker } from '@faker-js/faker'

import { PetNotFound } from '../models/ts/PetNotFound'
export function createPetNotFound(): PetNotFound {
  return { code: faker.number.float({}), message: faker.string.alpha() }
}
