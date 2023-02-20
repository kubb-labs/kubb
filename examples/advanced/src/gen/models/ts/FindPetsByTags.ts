import type { Pet } from './Pet'

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
