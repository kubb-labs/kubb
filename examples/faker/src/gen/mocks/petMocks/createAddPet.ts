import { createPet } from '../createPet'

/**
 * @description Invalid input
 */

export function createAddPet405() {
  return undefined
}

/**
 * @description Create a new pet in the store
 */

export function createAddPetMutationRequest() {
  return createPet()
}

/**
 * @description Successful operation
 */

export function createAddPetMutationResponse() {
  return createPet()
}
