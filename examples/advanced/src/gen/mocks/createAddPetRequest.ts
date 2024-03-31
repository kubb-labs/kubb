import { faker } from '@faker-js/faker'
import type { AddPetRequest } from '../models/ts/AddPetRequest'
import { createCategory } from './createCategory'
import { createTagTag } from './tag/createTag'

export function createAddPetRequest(override: NonNullable<Partial<AddPetRequest>> = {}): NonNullable<AddPetRequest> {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: createCategory(),
      photoUrls: faker.helpers.arrayElements([faker.string.alpha()]) as any,
      tags: faker.helpers.arrayElements([createTagTag()]) as any,
      status: faker.helpers.arrayElement(['working', 'idle']) as any,
    },
    ...override,
  }
}
