import type { AddPetRequest } from '../AddPetRequest'
import type { Pet } from '../Pet'

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

/**
 * AddPetMutationRequest
 * AddPetMutationRequest
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = AddPetRequest

/**
 * AddPetMutationResponse
 * AddPetMutationResponse
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet
