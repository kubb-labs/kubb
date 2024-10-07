import type {
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags200,
  FindPetsByTagsQueryResponse,
} from '../../models/ts/petController/FindPetsByTags.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryParamsFaker(data: NonNullable<Partial<FindPetsByTagsQueryParams>> = {}) {
  return {
    ...{ tags: faker.helpers.multiple(() => faker.string.alpha()) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() },
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
export function createFindPetsByTags200Faker() {
  return faker.helpers.multiple(() => createPetFaker()) as any
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
export function createFindPetsByTagsQueryResponseFaker() {
  return faker.helpers.multiple(() => createPetFaker()) as any
}
