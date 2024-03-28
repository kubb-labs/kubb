import { faker } from '@faker-js/faker'
import type { AddPetRequest } from '../models/AddPetRequest'
import { createCategory } from './createCategory'
import { createTag } from './createTag'

export function createAddPetRequest(override: NonNullable<Partial<AddPetRequest>> = {}): NonNullable<AddPetRequest> {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: createCategory(),
      photoUrls: faker.helpers.arrayElements([faker.string.alpha()]) as any,
      tags: faker.helpers.arrayElements([createTag()]) as any,
      status: faker.helpers.arrayElement<any>(['available', 'pending', 'sold']),
    },
    ...override,
  }
}
