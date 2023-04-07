import type { Pet } from '../Pet'

export type FindPetsByTagsQueryParams = {
  /**
   * @type array | undefined
   */
  tags?: string[] | undefined
}

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any | null

/**
 * @description successful operation
 */
export type FindPetsByTagsResponse = Pet[]
