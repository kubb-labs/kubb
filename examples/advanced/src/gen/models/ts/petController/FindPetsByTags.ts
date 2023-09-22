import type { Pet } from '../Pet'

/**
 * FindPetsByTags400
 * FindPetsByTags400
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any | null

export const FindpetsbytagsheaderparamsXexample = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const
export type FindpetsbytagsheaderparamsXexample = (typeof FindpetsbytagsheaderparamsXexample)[keyof typeof FindpetsbytagsheaderparamsXexample]
export type FindpetsbytagsHeaderparams = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': FindpetsbytagsheaderparamsXexample
}

export type FindpetsbytagsQueryparams = {
  /**
   * @description Tags to filter by
   * @type array | undefined
   */
  tags?: string[]
  /**
   * @description to request with required page number or pagination
   * @type string | undefined
   */
  page?: string
  /**
   * @description to request with required page size
   * @type string | undefined
   */
  pageSize?: string
}

/**
 * FindPetsByTagsQueryResponse
 * FindPetsByTagsQueryResponse
 * @description successful operation
 */
export type FindPetsByTagsQueryResponse = Pet[]
