import { faker } from '@faker-js/faker'
import type { PostPetRequest } from '../models/ts/PostPetRequest.ts'
import { createCategoryFaker } from './createCategoryFaker.ts'
import { createTagTagFaker } from './tag/createTagFaker.ts'

export function createPostPetRequestFaker(data?: Partial<PostPetRequest>): PostPetRequest {
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
