import { faker } from '@faker-js/faker'
import type { FindPetsByStatusPathParams, FindPetsByStatusResponseData, FindPetsByStatusStatus200 } from '../../models/ts/petController/FindPetsByStatus.ts'
import { createPetFaker } from '../createPetFaker.ts'

export function createFindPetsByStatusPathParamsFaker(data?: Partial<FindPetsByStatusPathParams>): FindPetsByStatusPathParams {
  return {
    ...{ step_id: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200Faker(data?: FindPetsByStatusStatus200): FindPetsByStatusStatus200 {
  return [...faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }), ...(data || [])]
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatusStatus400Faker() {
  return undefined
}

export function createFindPetsByStatusResponseDataFaker(data?: Partial<FindPetsByStatusResponseData>): FindPetsByStatusResponseData {
  return data || faker.helpers.arrayElement<any>([createFindPetsByStatusStatus200Faker()])
}
