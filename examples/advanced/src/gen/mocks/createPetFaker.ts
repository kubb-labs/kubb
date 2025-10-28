import type { Pet } from '../models/ts/Pet.ts'
import { createCategoryFaker } from './createCategoryFaker.ts'
import { createTagTagFaker } from './tag/createTagFaker.ts'
import { faker } from '@faker-js/faker'

export function createPetFaker(data?: Partial<Pet>): Pet {
  return {
    ...{
      id: faker.number.int(),
      signature: faker.helpers.fromRegExp('^data:image/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$'),
      name: faker.string.alpha(),
      url: faker.internet.url(),
      category: createCategoryFaker(),
      photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
      tags: faker.helpers.multiple(() => createTagTagFaker()),
      status: faker.helpers.arrayElement<any>(['working', 'idle']),
    },
    ...(data || {}),
  }
}
