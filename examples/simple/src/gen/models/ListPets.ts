import type { Pets } from './Pets'

export type ListPetsParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description A paged array of pets
 */
export type ListPetsResponse = Pets
