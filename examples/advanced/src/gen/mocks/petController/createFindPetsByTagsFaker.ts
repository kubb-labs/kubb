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
    ...{ tags: faker.helpers.multiple(() => faker.string.alpha()) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createFindPetsByTagsHeaderParamsFaker(data?: Partial<FindPetsByTagsHeaderParams>): FindPetsByTagsHeaderParams {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200Faker(data?: Partial<FindPetsByTags200>): FindPetsByTags200 {
  return [...(faker.helpers.multiple(() => createPetFaker()) as any), ...(data || [])]
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
