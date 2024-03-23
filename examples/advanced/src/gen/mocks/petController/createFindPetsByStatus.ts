import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type {
  FindPetsByStatus200,
  FindPetsByStatus400,
  FindPetsByStatusQueryParams,
  FindPetsByStatusQueryResponse,
} from '../../models/ts/petController/FindPetsByStatus'

/**
 * @description Invalid status value
 */
export function createFindPetsByStatus400(override?: NonNullable<Partial<FindPetsByStatus400>>): NonNullable<FindPetsByStatus400> {
  return undefined
}

export function createFindPetsByStatusQueryParams(override: NonNullable<Partial<FindPetsByStatusQueryParams>> = {}): NonNullable<FindPetsByStatusQueryParams> {
  return {
    ...{ 'status': faker.helpers.arrayElement<any>(['available', 'pending', 'sold']) },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200(override: NonNullable<Partial<FindPetsByStatus200>> = []): NonNullable<FindPetsByStatus200> {
  return [
    ...faker.helpers.arrayElements([createPet()]) as any,
    ...override,
  ]
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusQueryResponse(
  override: NonNullable<Partial<FindPetsByStatusQueryResponse>> = [],
): NonNullable<FindPetsByStatusQueryResponse> {
  return [
    ...faker.helpers.arrayElements([createPet()]) as any,
    ...override,
  ]
}
