import type { AddPetRequest } from '../AddPetRequest.ts'
import type { Pet } from '../Pet.ts'

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
 */
export type AddPetError = Omit<NonNullable<Pet>, 'name'>

export type AddPetMutationRequest = AddPetRequest

export type AddPetMutation = {
  Response: any
  Request: AddPetMutationRequest
  Errors: AddPet405 | AddPetError
}

export type AddPetMutationResponse = any
