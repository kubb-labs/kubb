import { faker } from '@faker-js/faker'

import { createCategory } from './createCategory'
import { createTag } from './createTag'

import type { Pet } from '../models/Pet'

export function createPet(): Pet {
  return {
    id: faker.number.float({}),
    name: faker.string.alpha(),
    category: createCategory(),
    photoUrls: faker.helpers.arrayElements([faker.string.alpha()]),
    tags: faker.helpers.arrayElements([createTag()]),
    status: faker.helpers.arrayElement([`available`, `pending`, `sold`]),
  }
}
