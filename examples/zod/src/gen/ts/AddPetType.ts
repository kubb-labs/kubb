import type { AddPetRequestType } from './AddPetRequestType.ts'
import type { PetType } from './PetType.ts'

/**
 * @description Successful operation
 */
export type AddPet200Type = PetType

/**
 * @description Pet not found
 */
export type AddPet405Type = {
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
export type AddPetMutationRequestType = AddPetRequestType

export type AddPetMutationResponseType = AddPet200Type

export type AddPetTypeMutation = {
  Response: AddPet200Type
  Request: AddPetMutationRequestType
  Errors: AddPet405Type
}
