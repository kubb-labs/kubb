import type { AddPetRequest } from '../AddPetRequest'
import type { Pet } from '../Pet'

export type AddPet405 = {
  /**
   * @type integer | undefined int32
   */
  code?: number | undefined
  /**
   * @type string | undefined
   */
  message?: string | undefined
}

/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = AddPetRequest

/**
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet
