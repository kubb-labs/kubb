import type { FindPetsByTagsQueryParams, FindPetsByTags200, FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryParams(data?: Partial<FindPetsByTagsQueryParams>): Partial<FindPetsByTagsQueryParams> {
  faker.seed([220])
  return {
    ...{ tags: faker.helpers.multiple(() => faker.string.alpha()) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200(data?: Partial<FindPetsByTags200>): Partial<FindPetsByTags200> {
  faker.seed([220])
  return [...(faker.helpers.multiple(() => createPet()) as any), ...(data || [])]
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400() {
  faker.seed([220])
  return undefined
}

export function createFindPetsByTagsQueryResponse(data?: Partial<FindPetsByTagsQueryResponse>): Partial<FindPetsByTagsQueryResponse> {
  faker.seed([220])
  return data || faker.helpers.arrayElement<any>([createFindPetsByTags200()])
}
