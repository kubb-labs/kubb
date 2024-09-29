import type { Pet } from '../models/ts/Pet.js'
import { createCategoryFaker } from './createCategoryFaker.js'
import { createTagTagFaker } from './tag/createTagFaker.js'
import { faker } from '@faker-js/faker'

export function createPetFaker(data: NonNullable<Partial<Pet>> = {}) {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: createCategoryFaker(),
      photoUrls: faker.helpers.arrayElements([faker.string.alpha()]) as any,
      tags: faker.helpers.arrayElements([createTagTagFaker()]) as any,
      status: faker.helpers.arrayElement(['working', 'idle']) as any,
    },
    ...data,
  }
}
