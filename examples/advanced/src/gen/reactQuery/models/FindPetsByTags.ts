import type { Pet } from '../../models/ts/Pet'

export type FindPetsByTagsParams = {
  /**
   * @type array | undefined
   */
  tags?: string[] | undefined
}

/**
 * @description successful operation
 */
export type FindPetsByTagsResponse = Pet[]
