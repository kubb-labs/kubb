import type { AddPetRequest } from '../models/AddPetRequest'
import { createCategory } from './createCategory.ts'
import { createTag } from './createTag.ts'
import { faker } from '@faker-js/faker'

export function createAddPetRequest(data: NonNullable<Partial<AddPetRequest>> = {}): NonNullable<AddPetRequest> {
  faker.seed([220])
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: createCategory(),
      photoUrls: faker.helpers.arrayElements([faker.string.alpha()]) as any,
      tags: faker.helpers.arrayElements([createTag()]) as any,
      status: faker.helpers.arrayElement<any>(['available', 'pending', 'sold']),
    },
    ...data,
  }
}
