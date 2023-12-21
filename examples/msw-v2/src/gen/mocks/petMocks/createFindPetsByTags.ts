import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByTags400, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'

/**
 * @description Invalid tag value
 */

export function createFindPetsByTags400(): NonNullable<FindPetsByTags400> {
  faker.seed([220])
  return undefined
}

export function createFindPetsByTagsQueryParams(): NonNullable<FindPetsByTagsQueryParams> {
  faker.seed([220])
  return { 'tags': faker.helpers.arrayElements([faker.string.alpha()]) as any, 'page': faker.string.alpha(), 'pageSize': faker.string.alpha() }
}
/**
 * @description successful operation
 */

export function createFindPetsByTagsQueryResponse(): NonNullable<FindPetsByTagsQueryResponse> {
  faker.seed([220])
  return faker.helpers.arrayElements([createPet()]) as any
}
