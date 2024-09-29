import { createPetFaker } from '../createPetFaker.ts'

/**
 * @description Successful operation
 */
export function createUpdatePet200Faker() {
  return createPetFaker()
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePet400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePet404Faker() {
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePet405Faker() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetMutationRequestFaker() {
  return createPetFaker()
}

/**
 * @description Successful operation
 */
export function createUpdatePetMutationResponseFaker() {
  return createPetFaker()
}
