import type { Pet } from './Pet'

export type FindPetsByTagsQueryParams = {
  /**
   * @type array | undefined
   */
  tags?: string[] | undefined
}

/**
 * @description successful operation
 */
export type FindPetsByTagsResponse = Pet[]
