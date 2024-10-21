import type { Pet } from './Pet.ts'

/**
 * @description Successful operation
 */
export type AddPet200 = Pet

/**
 * @description Invalid input
 */
export type AddPet405 = any

/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = Pet

export type AddPetMutationResponse = AddPet200

export type AddPetMutation = {
  Response: AddPet200
  Request: AddPetMutationRequest
  Errors: AddPet405
}
