import type { PetType } from './PetType'

/**
 * @description Successful operation
 */
export type UpdatePet200Type = PetType
/**
 * @description Invalid ID supplied
 */
export type UpdatePet400Type = any
/**
 * @description Pet not found
 */
export type UpdatePet404Type = any
/**
 * @description Validation exception
 */
export type UpdatePet405Type = any
/**
 * @description Update an existent pet in the store
 */
export type UpdatePetMutationRequestType = PetType
/**
 * @description Successful operation
 */
export type UpdatePetMutationResponseType = PetType
export type UpdatePetTypeMutation = {
  Response: UpdatePetMutationResponseType
  Request: UpdatePetMutationRequestType
  Errors: UpdatePet400Type | UpdatePet404Type | UpdatePet405Type
}
