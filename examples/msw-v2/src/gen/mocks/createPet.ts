import { faker } from '@faker-js/faker'
import type { Pet } from '../models/Pet'
import { createCategory } from './createCategory'
import { createTag } from './createTag'

export function createPet(override: NonNullable<Partial<Pet>> = {}): NonNullable<Pet> {
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
    ...override,
  }
}
