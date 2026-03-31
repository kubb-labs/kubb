import type { AddPetRequest } from '../AddPetRequest.ts'
import type { Pet } from '../Pet.ts'

/**
 * @type object
 */
export type AddPet405 = {
  /**
   * @type integer | undefined
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

/**
 * @description Successful operation
 * @type object
 */
export type AddPetError = Omit<NonNullable<Pet>, 'name'>

/**
 * @description Create a new pet in the store
 * @type object
 */
export type AddPetMutationRequest = AddPetRequest

export type AddPetMutationResponse = any

/**
 * @type object
 */
export type AddPetMutation = {
  Response: any
  Request: AddPetMutationRequest
  Errors: AddPet405 | AddPetError
}
