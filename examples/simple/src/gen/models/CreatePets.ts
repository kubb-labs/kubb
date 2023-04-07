import type { Pet } from './Pet'
import type { Error } from './Error'

export type CreatePetsRequest = {
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
export type CreatePetsResponse = Pet

/**
 * @description Created Pet fail
 */
export type CreatePets500 = Error

/**
 * @description unexpected error
 */
export type CreatePetsError = Error
