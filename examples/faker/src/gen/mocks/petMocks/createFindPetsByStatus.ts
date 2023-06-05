import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'

/**
 * @description Invalid status value
 */

export function createFindPetsByStatus400() {
  return undefined
}

export function createFindPetsByStatusQueryParams() {
  return { status: faker.helpers.arrayElement([[`available`, `pending`, `sold`]]) }
}

/**
 * @description successful operation
 */

export function createFindPetsByStatusQueryResponse() {
  return faker.helpers.arrayElement([createPet()])
}
