import type { FindPetsByStatusQueryParams, FindPetsByStatus200, FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByStatusQueryParams(data: NonNullable<Partial<FindPetsByStatusQueryParams>> = {}) {
  return {
    ...{ status: faker.helpers.arrayElement(['working', 'idle']) as any },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200(data: NonNullable<Partial<FindPetsByStatus200>> = []) {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatus400() {
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusQueryResponse(data: NonNullable<Partial<FindPetsByStatusQueryResponse>> = []) {
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}
