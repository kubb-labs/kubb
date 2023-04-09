import type { Error } from './Error'
import type { Pets } from './Pets'

export type ListPetsQueryParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description unexpected error
 */
export type ListPetsError = Error

/**
 * @description A paged array of pets
 */
export type ListPetsResponse = Pets
