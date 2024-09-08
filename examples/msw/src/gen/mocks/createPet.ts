import type { Pet } from '../models/Pet.ts'
import { createCategory } from './createCategory.ts'
import { createTag } from './createTag.ts'
import { faker } from '@faker-js/faker'

export function createPet(data: NonNullable<Partial<Pet>> = {}) {
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
