import type { AddPetRequest } from '../models/AddPetRequest.ts'
import { createCategory } from './createCategory.ts'
import { createTag } from './createTag.ts'
import { faker } from '@faker-js/faker'

export function createAddPetRequest(data: NonNullable<Partial<AddPetRequest>> = {}) {
  faker.seed([220])
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: createCategory(),
      photoUrls: faker.helpers.multiple(() => faker.string.alpha()) as any,
      tags: faker.helpers.multiple(() => createTag()) as any,
      status: faker.helpers.arrayElement<any>(['available', 'pending', 'sold']),
    },
    ...data,
  }
}
