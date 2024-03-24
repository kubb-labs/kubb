import type { Pet } from './Pet'
import type { AddPetRequest } from './AddPetRequest'

/**
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet

/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = AddPetRequest

/**
 * @description Successful operation
 */
export type AddPet200 = Pet

export type AddPet405 = {
  /**
   * @type integer | undefined int32
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

export type AddPetMutation = {
  Response: AddPetMutationResponse
  Request: AddPetMutationRequest
  Errors: AddPet405
}
