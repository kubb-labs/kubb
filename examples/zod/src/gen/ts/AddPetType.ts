import type { PetType } from './PetType'
import type { AddPetRequestType } from './AddPetRequestType'

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
/**
 * @description Successful operation
 */
export type AddPetMutationResponseType = PetType
export type AddPetTypeMutation = {
  Response: AddPetMutationResponseType
  Request: AddPetMutationRequestType
  Errors: AddPet405Type
}
