import { faker } from '@faker-js/faker'
import type {
  FindPetsByTags200,
  FindPetsByTagsHeaderParams,
  FindPetsByTagsQueryParams,
  FindPetsByTagsQueryResponse,
} from '../../models/ts/petController/FindPetsByTags.ts'
import { createPetFaker } from '../createPetFaker.ts'

export function createFindPetsByTagsQueryParamsFaker(data?: Partial<FindPetsByTagsQueryParams>) {
  return {
    ...{ tags: faker.helpers.multiple(() => faker.string.alpha()), page: faker.string.alpha(), pageSize: faker.number.float() },
    ...(data || {}),
  } as FindPetsByTagsQueryParams
}

export function createFindPetsByTagsHeaderParamsFaker(data?: Partial<FindPetsByTagsHeaderParams>) {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<NonNullable<FindPetsByTagsHeaderParams>['X-EXAMPLE']>(['ONE', 'TWO', 'THREE']) },
    ...(data || {}),
  } as FindPetsByTagsHeaderParams
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200Faker(data?: FindPetsByTags200) {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || [])] as FindPetsByTags200
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400Faker() {
  return undefined
}

export function createFindPetsByTagsQueryResponseFaker(data?: Partial<FindPetsByTagsQueryResponse>) {
  return data || (faker.helpers.arrayElement<any>([createFindPetsByTags200Faker()]) as FindPetsByTagsQueryResponse)
}
