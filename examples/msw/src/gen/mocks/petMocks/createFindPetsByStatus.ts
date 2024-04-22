import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByStatusQueryParams, FindPetsByStatus200, FindPetsByStatus400, FindPetsByStatusQueryResponse } from '../../models/FindPetsByStatus'

export function createFindPetsByStatusQueryParams(): NonNullable<FindPetsByStatusQueryParams> {
  return { status: faker.helpers.arrayElement<any>(['available', 'pending', 'sold']) }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200(): NonNullable<FindPetsByStatus200> {
  return faker.helpers.arrayElements([createPet()]) as any
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatus400(): NonNullable<FindPetsByStatus400> {
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusQueryResponse(): NonNullable<FindPetsByStatusQueryResponse> {
  return faker.helpers.arrayElements([createPet()]) as any
}
