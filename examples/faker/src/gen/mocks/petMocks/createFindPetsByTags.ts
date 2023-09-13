import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { FindPetsByTags400 } from '../../models/FindPetsByTags'
import { FindPetsByTagsQueryParams } from '../../models/FindPetsByTags'
import { FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400(): FindPetsByTags400 {
  return undefined
}

export function createFindPetsByTagsQueryParams(): FindPetsByTagsQueryParams {
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) as any }
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsQueryResponse(): FindPetsByTagsQueryResponse {
  return faker.helpers.arrayElements([createPet()]) as any
}
