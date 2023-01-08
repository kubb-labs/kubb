import type { Pet } from '../../models/ts/Pet'

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
