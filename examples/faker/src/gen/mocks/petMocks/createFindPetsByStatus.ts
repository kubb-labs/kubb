import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByStatus400, FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../../models/FindPetsByStatus'

/**
 * @description Invalid status value
 */

export function createFindPetsByStatus400(): NonNullable<FindPetsByStatus400> {
  return undefined
}

export function createFindPetsByStatusQueryParams(): NonNullable<FindPetsByStatusQueryParams> {
  return { status: faker.helpers.arrayElement<any>([`available`, `pending`, `sold`]) }
}
/**
 * @description successful operation
 */

export function createFindPetsByStatusQueryResponse(): NonNullable<FindPetsByStatusQueryResponse> {
  return faker.helpers.arrayElements([createPet()]) as any
}
