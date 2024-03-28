import { faker } from '@faker-js/faker'
import type {
  FindPetsByTags200,
  FindPetsByTags400,
  FindPetsByTagsHeaderParams,
  FindPetsByTagsQueryParams,
  FindPetsByTagsQueryResponse,
} from '../../models/ts/petController/FindPetsByTags'
import { createPet } from '../createPet'

export function createFindPetsByTagsQueryParams(override: NonNullable<Partial<FindPetsByTagsQueryParams>> = {}): NonNullable<FindPetsByTagsQueryParams> {
  return {
    ...{ tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() },
    ...override,
  }
}

export function createFindPetsByTagsHeaderParams(override: NonNullable<Partial<FindPetsByTagsHeaderParams>> = {}): NonNullable<FindPetsByTagsHeaderParams> {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200(override: NonNullable<Partial<FindPetsByTags200>> = []): NonNullable<FindPetsByTags200> {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...override]
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400(override?: NonNullable<Partial<FindPetsByTags400>>): NonNullable<FindPetsByTags400> {
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsQueryResponse(override: NonNullable<Partial<FindPetsByTagsQueryResponse>> = []): NonNullable<FindPetsByTagsQueryResponse> {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...override]
}
