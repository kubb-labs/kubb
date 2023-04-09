import type { Error } from './Error'
import type { Pet } from './Pet'

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
 * @description unexpected error
 */
export type CreatePetsError = Error

/**
 * @description Created Pet
 */
export type CreatePetsResponse = Pet
