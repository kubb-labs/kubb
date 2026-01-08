import type {
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTagsStatus200,
  FindPetsByTagsResponseData,
} from '../../models/ts/petController/FindPetsByTags.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryParamsFaker(data?: Partial<FindPetsByTagsQueryParams>): FindPetsByTagsQueryParams {
  return {
    ...{ tags: faker.helpers.multiple(() => faker.string.alpha()), page: faker.string.alpha(), pageSize: faker.number.float() },
    ...(data || {}),
  }
}

export function createFindPetsByTagsHeaderParamsFaker(data?: Partial<FindPetsByTagsHeaderParams>): FindPetsByTagsHeaderParams {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<NonNullable<FindPetsByTagsHeaderParams>['X-EXAMPLE']>(['ONE', 'TWO', 'THREE']) },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200Faker(data?: FindPetsByTagsStatus200): FindPetsByTagsStatus200 {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || [])]
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTagsStatus400Faker() {
  return undefined
}

export function createFindPetsByTagsResponseDataFaker(data?: Partial<FindPetsByTagsResponseData>): FindPetsByTagsResponseData {
  return data || faker.helpers.arrayElement<any>([createFindPetsByTagsStatus200Faker()])
}
