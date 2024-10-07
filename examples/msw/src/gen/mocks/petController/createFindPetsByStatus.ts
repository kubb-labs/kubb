import type { FindPetsByStatusQueryParams, FindPetsByStatus200, FindPetsByStatusQueryResponse } from '../../models/FindPetsByStatus.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByStatusQueryParams(data: NonNullable<Partial<FindPetsByStatusQueryParams>> = {}) {
  faker.seed([220])
  return {
    ...{ status: faker.helpers.arrayElement<any>(['available', 'pending', 'sold']) },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createFindPetsByStatus200() {
  faker.seed([220])
  return faker.helpers.multiple(() => createPet()) as any
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatus400() {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusQueryResponse() {
  faker.seed([220])
  return faker.helpers.multiple(() => createPet()) as any
}
