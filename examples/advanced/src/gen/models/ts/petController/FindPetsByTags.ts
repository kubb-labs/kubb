import type { Pet } from '../Pet'

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any | null

export type FindPetsByTagsQueryParams = {
  /**
   * @type array | undefined
   */
  tags?: string[] | undefined
}

/**
 * @description successful operation
 */
export type FindPetsByTagsQueryResponse = Pet[]
