import { faker } from '@faker-js/faker'

import { createCategory } from './createCategory'
import { createTag } from './createTag'

export function createPet() {
  return {
    id: faker.number.float({}),
    name: faker.string.alpha({}),
    category: createCategory(),
    photoUrls: faker.helpers.arrayElement([faker.string.alpha({})]),
    tags: faker.helpers.arrayElement([createTag()]),
    status: faker.helpers.arrayElement([[`available`, `pending`, `sold`]]),
  }
}
