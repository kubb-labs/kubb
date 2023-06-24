import { faker } from '@faker-js/faker'

import { createCategory as createCategory3 } from './createCategory'
import { createTag } from './createTag'
import { AddPetRequest } from '../models/ts/AddPetRequest'

export function createAddPetRequest(): AddPetRequest {
  return {
    id: faker.number.float({}),
    name: faker.string.alpha(),
    category: createCategory3(),
    photoUrls: faker.helpers.arrayElements([faker.string.alpha()]) as any,
    tags: faker.helpers.arrayElements([createTag()]) as any,
    status: faker.helpers.arrayElement<any>([`available`, `pending`, `sold`]),
  }
}
