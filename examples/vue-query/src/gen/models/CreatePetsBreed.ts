import type { Error } from './Error'
import type { Pet } from './Pet'

export type CreatePetsBreedPathParams = {
  /**
   * @type string
   */
  breed: string
}

export type CreatePetsBreedRequest = {
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
 * @description unexpected error
 */
export type CreatePetsBreedError = Error

/**
 * @description Created Pet
 */
export type CreatePetsBreedResponse = Pet
