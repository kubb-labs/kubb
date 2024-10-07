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
export function createFindPetsByStatus200Faker() {
  return faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }) as any
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
export function createFindPetsByStatusQueryResponseFaker() {
  return faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }) as any
}
