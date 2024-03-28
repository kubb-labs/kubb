import { faker } from '@faker-js/faker'
import type { Pet } from '../models/ts/Pet'
import { createCategory } from './createCategory'
import { createTagTag } from './tag/createTag'

export function createPet(override: NonNullable<Partial<Pet>> = {}): NonNullable<Pet> {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: createCategory(),
      photoUrls: faker.helpers.arrayElements([faker.string.alpha()]) as any,
      tags: faker.helpers.arrayElements([createTagTag()]) as any,
      status: faker.helpers.arrayElement<any>(['available', 'pending', 'sold']),
    },
    ...override,
  }
}
