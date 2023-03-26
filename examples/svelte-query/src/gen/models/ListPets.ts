import type { Pets } from './Pets'

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
