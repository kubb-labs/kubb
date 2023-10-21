import { faker } from '@faker-js/faker'

import { FindPetsByTags400 } from '../../models/FindPetsByTags'
import { FindPetsByTagsQueryParams } from '../../models/FindPetsByTags'
import { FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags'
import { createPet } from '../createPet'

/**
 * @description Invalid tag value
 */

export function createFindPetsByTags400(): NonNullable<FindPetsByTags400> {
  return undefined
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
