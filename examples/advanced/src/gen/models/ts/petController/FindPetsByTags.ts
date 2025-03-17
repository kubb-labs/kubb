import type { Pet } from '../Pet.ts'

export type FindPetsByTagsQueryParams = {
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

export const findPetsByTagsHeaderParamsXEXAMPLEEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type FindPetsByTagsHeaderParamsXEXAMPLEEnum = (typeof findPetsByTagsHeaderParamsXEXAMPLEEnum)[keyof typeof findPetsByTagsHeaderParamsXEXAMPLEEnum]

export type FindPetsByTagsHeaderParams = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': FindPetsByTagsHeaderParamsXEXAMPLEEnum
}

/**
 * @description successful operation
 */
export type FindPetsByTags200 = Pet[]

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any

export type FindPetsByTagsQueryResponse = FindPetsByTags200

export type FindPetsByTagsQuery = {
  Response: FindPetsByTags200
  QueryParams: FindPetsByTagsQueryParams
  HeaderParams: FindPetsByTagsHeaderParams
  Errors: FindPetsByTags400
}
