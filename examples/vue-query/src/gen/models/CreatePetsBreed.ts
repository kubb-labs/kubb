import type { Pet } from './Pet'
import type { Error } from './Error'

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
 * @description Created Pet
 */
export type CreatePetsBreedResponse = Pet

/**
 * @description unexpected error
 */
export type CreatePetsBreedError = Error
