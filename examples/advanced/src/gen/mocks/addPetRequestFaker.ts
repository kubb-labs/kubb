import { faker } from '@faker-js/faker'
import type { AddPetRequest } from '../models/ts/addPetRequest.ts'
import { createCategoryFaker } from './categoryFaker.ts'
import { createTagTagFaker } from './tag/tagFaker.ts'

export function createAddPetRequestFaker(data?: Partial<AddPetRequest>): AddPetRequest {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: createCategoryFaker(),
      photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
      tags: faker.helpers.multiple(() => createTagTagFaker()),
      status: faker.helpers.arrayElement<any>(['working', 'idle']),
    },
    ...(data || {}),
  }
}
