import type { Error } from './Error'
import type { Pet } from './Pet'

export type CreatePetsBreedMutationRequest = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
}

export type CreatePetsBreedPathParams = {
  /**
   * @type string
   */
  breed: string
}

/**
 * @description unexpected error
 */
export type CreatePetsBreedError = Error

/**
 * @description Created Pet
 */
export type CreatePetsBreedMutationResponse = Pet
