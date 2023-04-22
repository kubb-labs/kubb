import type { Error } from './Error'
import type { Pet } from './Pet'

export type CreatePetsMutationRequest = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
}

/**
 * @description Created Pet fail
 */
export type CreatePets500 = Error

/**
 * @description unexpected error
 */
export type CreatePetsError = Error

/**
 * @description Created Pet
 */
export type CreatePetsMutationResponse = Pet
