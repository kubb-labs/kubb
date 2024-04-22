import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByStatusQueryParams, FindPetsByStatus200, FindPetsByStatus400, FindPetsByStatusQueryResponse } from '../../models/FindPetsByStatus'

export function createFindPetsByStatusQueryParams(): NonNullable<FindPetsByStatusQueryParams> {
  faker.seed([220])
  return { status: faker.helpers.arrayElement<any>(['available', 'pending', 'sold']) }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200(): NonNullable<FindPetsByStatus200> {
  faker.seed([220])
  return faker.helpers.arrayElements([createPet()]) as any
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatus400(): NonNullable<FindPetsByStatus400> {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusQueryResponse(): NonNullable<FindPetsByStatusQueryResponse> {
  faker.seed([220])
  return faker.helpers.arrayElements([createPet()]) as any
}
