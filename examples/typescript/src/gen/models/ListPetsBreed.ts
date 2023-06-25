import type { Error } from './Error'
import type { Pets } from './Pets'

export type ListPetsBreedPathParams = {
  /**
   * @type string
   */
  breed: string
}

export type ListPetsBreedQueryParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description unexpected error
 */
export type ListPetsBreedError = Error

/**
 * @description A paged array of pets
 */
export type ListPetsBreedQueryResponse = Pets
