import type {
  FindPetsByStatusQueryParams,
  FindPetsByStatus200,
  FindPetsByStatus400,
  FindPetsByStatusQueryResponse,
} from '../../models/ts/petController/FindPetsByStatus'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByStatusQueryParams(data: NonNullable<Partial<FindPetsByStatusQueryParams>> = {}): NonNullable<FindPetsByStatusQueryParams> {
  return {
    ...{ status: faker.helpers.arrayElement(['working', 'idle']) as any },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200(data: NonNullable<Partial<FindPetsByStatus200>> = []): NonNullable<FindPetsByStatus200> {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
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
export function createFindPetsByStatusQueryResponse(
  data: NonNullable<Partial<FindPetsByStatusQueryResponse>> = [],
): NonNullable<FindPetsByStatusQueryResponse> {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}
