import { faker } from '@faker-js/faker'
import { FindPetsByStatus400, FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../../models/FindPetsByStatus'
import { createPet } from '../createPet'

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
