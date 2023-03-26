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
 * @description Created Pet
 */
export type CreatePetsResponse = Pet
