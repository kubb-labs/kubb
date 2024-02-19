import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByTags200, FindPetsByTags400, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'

/**
 * @description Invalid tag value
 */

export function createFindPetsByTags400(override?: NonNullable<Partial<FindPetsByTags400>>): NonNullable<FindPetsByTags400> {
  faker.seed([220])
  return undefined
}

export function createFindPetsByTagsQueryParams(override: NonNullable<Partial<FindPetsByTagsQueryParams>> = {}): NonNullable<FindPetsByTagsQueryParams> {
  faker.seed([220])
  return {
    ...{ 'tags': faker.helpers.arrayElements([faker.string.alpha()]) as any, 'page': faker.string.alpha(), 'pageSize': faker.string.alpha() },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createFindPetsByTags200(override: NonNullable<Partial<FindPetsByTags200>> = []): NonNullable<FindPetsByTags200> {
  faker.seed([220])
  return [
    ...faker.helpers.arrayElements([createPet()]) as any,
    ...override,
  ]
}
/**
 * @description successful operation
 */

export function createFindPetsByTagsQueryResponse(override: NonNullable<Partial<FindPetsByTagsQueryResponse>> = []): NonNullable<FindPetsByTagsQueryResponse> {
  faker.seed([220])
  return [
    ...faker.helpers.arrayElements([createPet()]) as any,
    ...override,
  ]
}
