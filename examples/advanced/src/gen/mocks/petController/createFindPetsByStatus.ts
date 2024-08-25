import type {
  FindPetsByStatusQueryParams,
  FindPetsByStatus200,
  FindPetsByStatus400,
  FindPetsByStatusQueryResponse,
} from '../../models/ts/petController/FindPetsByStatus'
import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'

export function createFindPetsByStatusQueryParams(): NonNullable<FindPetsByStatusQueryParams> {
  return { status: faker.helpers.arrayElement(['working', 'idle']) as any }
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
