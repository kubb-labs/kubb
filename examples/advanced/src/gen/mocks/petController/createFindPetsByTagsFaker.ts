import type {
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags200,
  FindPetsByTagsQueryResponse,
} from '../../models/ts/petController/FindPetsByTags.js'
import { createPetFaker } from '../createPetFaker.js'
import { faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryParamsFaker(data: NonNullable<Partial<FindPetsByTagsQueryParams>> = {}) {
  return {
    ...{ tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() },
    ...data,
  }
}

export function createFindPetsByTagsHeaderParamsFaker(data: NonNullable<Partial<FindPetsByTagsHeaderParams>> = {}) {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200Faker(data: NonNullable<Partial<FindPetsByTags200>> = []) {
  return [...(faker.helpers.arrayElements([createPetFaker()]) as any), ...data]
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400Faker() {
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsQueryResponseFaker(data: NonNullable<Partial<FindPetsByTagsQueryResponse>> = []) {
  return [...(faker.helpers.arrayElements([createPetFaker()]) as any), ...data]
}
