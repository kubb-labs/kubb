import type { FindPetsByStatusQueryParams, FindPetsByStatus200, FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByStatusQueryParamsFaker(data?: Partial<FindPetsByStatusQueryParams>) {
  return {
    ...{ status: faker.helpers.arrayElement(['working', 'idle']) as any },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200Faker(data?: Partial<FindPetsByStatus200>) {
  return [...(faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }) as any), ...(data || [])]
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatus400Faker() {
  return undefined
}

export function createFindPetsByStatusQueryResponseFaker(data?: Partial<FindPetsByStatusQueryResponse>) {
  return faker.helpers.arrayElement<any>([createFindPetsByStatus200Faker()]) || data
}
