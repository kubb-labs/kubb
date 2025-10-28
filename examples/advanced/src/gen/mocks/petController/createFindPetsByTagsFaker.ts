import type {
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags200,
  FindPetsByTagsQueryResponse,
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
export function createFindPetsByTags200Faker(data?: FindPetsByTags200): FindPetsByTags200 {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || [])]
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400Faker() {
  return undefined
}

export function createFindPetsByTagsQueryResponseFaker(data?: Partial<FindPetsByTagsQueryResponse>): FindPetsByTagsQueryResponse {
  return data || faker.helpers.arrayElement<any>([createFindPetsByTags200Faker()])
}
