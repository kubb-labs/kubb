import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePet200() {
  faker.seed([220])
  return createPet()
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePet400() {
  faker.seed([220])
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePet404() {
  faker.seed([220])
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePet405() {
  faker.seed([220])
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetMutationRequest() {
  faker.seed([220])
  return createPet()
}

/**
 * @description Successful operation
 */
export function createUpdatePetMutationResponse() {
  faker.seed([220])
  return createPet()
}
