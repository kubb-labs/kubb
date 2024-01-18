import type { AddPetRequest } from './AddPetRequest'
import type { Pet } from './Pet'

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
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = AddPetRequest

/**
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet
export namespace AddPetMutation {
  export type Response = AddPetMutationResponse
  export type Request = AddPetMutationRequest
  export type Errors = AddPet405
}
