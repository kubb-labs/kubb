import { createPet } from '../createPet'

/**
 * @description Invalid ID supplied
 */

export function createUpdatePet400() {
  return undefined
}

/**
 * @description Pet not found
 */

export function createUpdatePet404() {
  return undefined
}

/**
 * @description Validation exception
 */

export function createUpdatePet405() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */

export function createUpdatePetMutationRequest() {
  return createPet()
}

/**
 * @description Successful operation
 */

export function createUpdatePetMutationResponse() {
  return createPet()
}
