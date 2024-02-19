import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { FindPetsByStatus400, FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../../models/FindPetsByStatus'

/**
 * @description Invalid status value
 */

export function createFindPetsByStatus400(override?: NonNullable<Partial<FindPetsByStatus400>>): NonNullable<FindPetsByStatus400> {
  faker.seed([220])
  return undefined
}

export function createFindPetsByStatusQueryParams(override: NonNullable<Partial<FindPetsByStatusQueryParams>> = {}): NonNullable<FindPetsByStatusQueryParams> {
  faker.seed([220])
  return {
    ...{ 'status': faker.helpers.arrayElement<any>([`available`, `pending`, `sold`]) },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createFindPetsByStatusQueryResponse(
  override: NonNullable<Partial<FindPetsByStatusQueryResponse>> = [],
): NonNullable<FindPetsByStatusQueryResponse> {
  faker.seed([220])
  return [
    ...faker.helpers.arrayElements([createPet()]) as any,
    ...override,
  ]
}
