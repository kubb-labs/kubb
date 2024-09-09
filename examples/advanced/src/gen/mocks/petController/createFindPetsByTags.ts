import type {
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags200,
  FindPetsByTagsQueryResponse,
} from '../../models/ts/petController/FindPetsByTags.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryParams(data: NonNullable<Partial<FindPetsByTagsQueryParams>> = {}) {
  return {
    ...{ tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() },
    ...data,
  }
}

export function createFindPetsByTagsHeaderParams(data: NonNullable<Partial<FindPetsByTagsHeaderParams>> = {}) {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByTags200(data: NonNullable<Partial<FindPetsByTags200>> = []) {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTags400() {
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsQueryResponse(data: NonNullable<Partial<FindPetsByTagsQueryResponse>> = []) {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}
