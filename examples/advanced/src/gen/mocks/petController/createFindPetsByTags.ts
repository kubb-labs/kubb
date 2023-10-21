import { faker } from '@faker-js/faker'

import { FindPetsByTags400 } from '../../models/ts/petController/FindPetsByTags'
import { FindPetsByTagsHeaderParams } from '../../models/ts/petController/FindPetsByTags'
import { FindPetsByTagsQueryParams } from '../../models/ts/petController/FindPetsByTags'
import { FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags'
import { createPet } from '../createPet'

/**
 * @description Invalid tag value
 */

export function createFindPetsByTags400(): NonNullable<FindPetsByTags400> {
  return undefined
}

export function createFindPetsByTagsHeaderParams(): NonNullable<FindPetsByTagsHeaderParams> {
  return { 'X-EXAMPLE': faker.helpers.arrayElement<any>([`ONE`, `TWO`, `THREE`]) }
}

export function createFindPetsByTagsQueryParams(): NonNullable<FindPetsByTagsQueryParams> {
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() }
}

/**
 * @description successful operation
 */

export function createFindPetsByTagsQueryResponse(): NonNullable<FindPetsByTagsQueryResponse> {
  return faker.helpers.arrayElements([createPet()]) as any
}
