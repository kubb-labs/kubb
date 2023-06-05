import { faker } from '@faker-js/faker'

import { createPet } from './createPet'

/**
 * @description Invalid ID supplied
 */

export function createGetPetById400() {
  return undefined
}

/**
 * @description Pet not found
 */

export function createGetPetById404() {
  return undefined
}

export function createGetPetByIdPathParams() {
  return { petId: faker.number.float({}) }
}

/**
 * @description successful operation
 */

export function createGetPetByIdQueryResponse() {
  return createPet()
}
