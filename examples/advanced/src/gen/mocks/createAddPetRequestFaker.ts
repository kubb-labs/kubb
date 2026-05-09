import { faker } from '@faker-js/faker'
import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import { createCategoryFaker } from './createCategoryFaker.ts'
import { createTagTagFaker } from './tag/createTagFaker.ts'

export function createAddPetRequestFaker(data?: Partial<AddPetRequest>): AddPetRequest {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      get category() {
        return createCategoryFaker()
      },
      photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
      get tags() {
        return faker.helpers.multiple(() => createTagTagFaker())
      },
      status: faker.helpers.arrayElement<any>(['working', 'idle']),
      ...(data || {}),
    },
  }
}
