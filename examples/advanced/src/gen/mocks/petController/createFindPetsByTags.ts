import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { FindPetsByTags400 } from '../../models/ts/petController/FindPetsByTags'
import { FindPetsByTagsQueryParams } from '../../models/ts/petController/FindPetsByTags'
import { FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags'
/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400(): FindPetsByTags400 {
  return undefined
}

export function createFindPetsByTagsQueryParams(): FindPetsByTagsQueryParams {
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsQueryResponse(): FindPetsByTagsQueryResponse {
  return faker.helpers.arrayElements([createPet()]) as any
}
