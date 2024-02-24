import type { Pet } from '../../models'

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any | null

export type FindPetsByTagsQueryParams =
  | {
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
  | undefined

/**
 * @description successful operation
 */
export type FindPetsByTags200 = Pet[]

/**
 * @description successful operation
 */
export type FindPetsByTagsQueryResponse = Pet[]
export type FindPetsByTagsQuery = {
  Response: FindPetsByTagsQueryResponse
  QueryParams: FindPetsByTagsQueryParams
  Errors: FindPetsByTags400
}
