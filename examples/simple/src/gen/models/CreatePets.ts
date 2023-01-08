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
 * @description Expected response to a valid post
 */
export type CreatePetsResponse = Pet
