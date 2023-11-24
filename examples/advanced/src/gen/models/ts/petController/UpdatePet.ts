import type { Pet } from '../Pet'

/**
 * @description Invalid ID supplied
 */
export type UpdatePet400 = any | null

/**
 * @description Pet not found
 */
export type UpdatePet404 = any | null

/**
 * @description Validation exception
 */
export type UpdatePet405 = any | null

/**
 * @description Update an existent pet in the store
 */
export type UpdatePetMutationRequest = Omit<NonNullable<Pet>, 'id'>

/**
 * @description Successful operation
 */
export type UpdatePetMutationResponse = Omit<NonNullable<Pet>, 'name'>
export namespace UpdatePetMutation {
  export type Response = UpdatePetMutationResponse
  export type Request = UpdatePetMutationRequest
  export type Errors = UpdatePet400 | UpdatePet404 | UpdatePet405
}
