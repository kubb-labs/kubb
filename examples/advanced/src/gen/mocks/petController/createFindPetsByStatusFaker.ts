import type { FindPetsByStatusQueryParams, FindPetsByStatus200, FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByStatusQueryParamsFaker(data: NonNullable<Partial<FindPetsByStatusQueryParams>> = {}) {
  return {
    ...{ status: faker.helpers.arrayElement(['working', 'idle']) as any },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200Faker(data: NonNullable<Partial<FindPetsByStatus200>> = []) {
  return [...(faker.helpers.arrayElements([createPetFaker()], { min: 1, max: 3 }) as any), ...data]
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatus400Faker() {
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusQueryResponseFaker(data: NonNullable<Partial<FindPetsByStatusQueryResponse>> = []) {
  return [...(faker.helpers.arrayElements([createPetFaker()], { min: 1, max: 3 }) as any), ...data]
}
