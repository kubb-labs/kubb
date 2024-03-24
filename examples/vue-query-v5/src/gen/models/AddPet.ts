import type { Pet } from './Pet'

/**
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet

/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = Pet

/**
 * @description Successful operation
 */
export type AddPet200 = Pet

/**
 * @description Invalid input
 */
export type AddPet405 = any

export type AddPetMutation = {
  Response: AddPetMutationResponse
  Request: AddPetMutationRequest
  Errors: AddPet405
}
