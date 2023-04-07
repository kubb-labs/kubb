import type { Pets } from './Pets'
import type { Error } from './Error'

export type ListPetsQueryParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description A paged array of pets
 */
export type ListPetsResponse = Pets

/**
 * @description unexpected error
 */
export type ListPetsError = Error
