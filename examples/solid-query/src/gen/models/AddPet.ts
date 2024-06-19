import type { AddPetRequest } from './AddPetRequest'
import type { Pet } from './Pet'

/**
 * @description Successful operation
 */
export type AddPet200 = Pet
/**
 * @description Pet not found
 */
export type AddPet405 = {
  /**
   * @type integer | undefined, int32
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}
/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = AddPetRequest
/**
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet
export type AddPetMutation = {
  Response: AddPetMutationResponse
  Request: AddPetMutationRequest
  Errors: AddPet405
}
