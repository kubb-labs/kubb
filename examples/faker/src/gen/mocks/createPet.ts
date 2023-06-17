import { faker } from '@faker-js/faker'

import { createCategory as createCategory2 } from './createCategory'
import { createTag } from './createTag'
import { Pet } from '../models/Pet'

export function createPet(): Pet {
  return {
    id: faker.number.float({}),
    name: faker.string.alpha(),
    category: createCategory2(),
    photoUrls: faker.helpers.arrayElements([faker.string.alpha()]) as any,
    tags: faker.helpers.arrayElements([createTag()]) as any,
    status: faker.helpers.arrayElement<any>([`available`, `pending`, `sold`]),
  }
}
