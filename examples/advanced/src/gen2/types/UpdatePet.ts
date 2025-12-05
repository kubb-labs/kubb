import type { Pet } from './Pet.ts'

/**
 * @description Successful operation
 */
export type UpdatePet200 = Omit<NonNullable<Pet>, 'name'>

/**
 * @description accepted operation
 */
export type UpdatePet202 = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
}

/**
 * @description Invalid ID supplied
 */
export type UpdatePet400 = any

/**
 * @description Pet not found
 */
export type UpdatePet404 = any

/**
 * @description Validation exception
 */
export type UpdatePet405 = any

/**
 * @description Update an existent pet in the store
 */
export type UpdatePetMutationRequest = Omit<NonNullable<Pet>, 'id'>

export type UpdatePetMutationResponse = UpdatePet200 | UpdatePet202

export type UpdatePetMutation = {
  Response: UpdatePet200 | UpdatePet202
  Request: UpdatePetMutationRequest
  Errors: UpdatePet400 | UpdatePet404 | UpdatePet405
}
