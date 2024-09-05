import type { FindPetsByTagsQueryParams, FindPetsByTags200, FindPetsByTags400, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryParams(data: NonNullable<Partial<FindPetsByTagsQueryParams>> = {}): NonNullable<FindPetsByTagsQueryParams> {
  faker.seed([220])
  return {
    ...{ tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200(data: NonNullable<Partial<FindPetsByTags200>> = []): NonNullable<FindPetsByTags200> {
  faker.seed([220])
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
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
export function createFindPetsByTagsQueryResponse(data: NonNullable<Partial<FindPetsByTagsQueryResponse>> = []): NonNullable<FindPetsByTagsQueryResponse> {
  faker.seed([220])
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}
