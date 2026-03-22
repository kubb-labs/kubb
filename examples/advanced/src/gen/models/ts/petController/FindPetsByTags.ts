import type { Pet } from '../Pet.ts'

export type FindPetsByTagsQueryParams = {
  /**
   * @description Tags to filter by
   */
  tags?: Array<string>
  /**
   * @description to request with required page number or pagination
   */
  page?: string
  /**
   * @description to request with required page size
   */
  pageSize?: number
}

export const findPetsByTagsHeaderParamsXEXAMPLEEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type FindPetsByTagsHeaderParamsXEXAMPLEEnumKey = (typeof findPetsByTagsHeaderParamsXEXAMPLEEnum)[keyof typeof findPetsByTagsHeaderParamsXEXAMPLEEnum]

export type FindPetsByTagsHeaderParams = {
  /**
   * @description Header parameters
   */
  xEXAMPLE: FindPetsByTagsHeaderParamsXEXAMPLEEnumKey
}

/**
 * @description successful operation
 */
export type FindPetsByTags200 = Array<Pet>

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
