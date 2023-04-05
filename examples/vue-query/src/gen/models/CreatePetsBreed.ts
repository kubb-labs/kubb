import type { Pet } from './Pet'

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
