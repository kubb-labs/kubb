import { faker } from '@faker-js/faker'
import type { FindPetsByTags200, FindPetsByTags400, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'
import { createPet } from '../createPet'

export function createFindPetsByTagsQueryParams(): NonNullable<FindPetsByTagsQueryParams> {
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200(): NonNullable<FindPetsByTags200> {
  return faker.helpers.arrayElements([createPet()]) as any
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400(): NonNullable<FindPetsByTags400> {
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsQueryResponse(): NonNullable<FindPetsByTagsQueryResponse> {
  return faker.helpers.arrayElements([createPet()]) as any
}
