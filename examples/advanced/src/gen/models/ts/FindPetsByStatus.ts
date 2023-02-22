import type { Pet } from './Pet'

export type FindPetsByStatusPathParams = {}

export type FindPetsByStatusQueryParams = {
  /**
   * @type string | undefined
   */
  status?: string | undefined
}

/**
 * @description successful operation
 */
export type FindPetsByStatusResponse = Pet[]
