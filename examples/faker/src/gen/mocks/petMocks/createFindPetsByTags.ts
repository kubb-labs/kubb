import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByTags400, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'

/**
 * @description Invalid tag value
 */

export function createFindPetsByTags400(): NonNullable<FindPetsByTags400> {
  return undefined
}

export function createFindPetsByTagsQueryParams(): NonNullable<FindPetsByTagsQueryParams> {
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) as any }
}
/**
 * @description successful operation
 */

export function createFindPetsByTagsQueryResponse(): NonNullable<FindPetsByTagsQueryResponse> {
  return faker.helpers.arrayElements([createPet()]) as any
}
