import type { AddPetRequest } from '../AddPetRequest.ts'
import type { Pet } from '../Pet.ts'

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
 * @description Successful operation
 */
export type AddPetError = Omit<NonNullable<Pet>, 'name'>

/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = AddPetRequest

export type AddPetMutationResponse = any

export type AddPetMutation = {
  Response: any
  Request: AddPetMutationRequest
  Errors: AddPet405
}
