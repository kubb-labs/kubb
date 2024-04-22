import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByTagsQueryParams, FindPetsByTags200, FindPetsByTags400, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'

export function createFindPetsByTagsQueryParams(): NonNullable<FindPetsByTagsQueryParams> {
  faker.seed([220])
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200(): NonNullable<FindPetsByTags200> {
  faker.seed([220])
  return faker.helpers.arrayElements([createPet()]) as any
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400(): NonNullable<FindPetsByTags400> {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsQueryResponse(): NonNullable<FindPetsByTagsQueryResponse> {
  faker.seed([220])
  return faker.helpers.arrayElements([createPet()]) as any
}
