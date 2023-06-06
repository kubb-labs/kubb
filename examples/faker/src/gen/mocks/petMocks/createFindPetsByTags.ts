import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'

import type { FindPetsByTags400, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'

/**
 * @description Invalid tag value
 */

export function createFindPetsByTags400(): FindPetsByTags400 {
  return undefined
}

export function createFindPetsByTagsQueryParams(): FindPetsByTagsQueryParams {
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) }
}

/**
 * @description successful operation
 */

export function createFindPetsByTagsQueryResponse(): FindPetsByTagsQueryResponse {
  return faker.helpers.arrayElements([createPet()])
}
