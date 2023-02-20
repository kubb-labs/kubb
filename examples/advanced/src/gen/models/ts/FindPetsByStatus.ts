import type { Pet } from './Pet'

export type FindPetsByStatusParams = {
  /**
   * @type string | undefined
   */
  status?: string | undefined
}

/**
 * @description successful operation
 */
export type FindPetsByStatusResponse = Pet[]
