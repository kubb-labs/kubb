import type { PetType } from './PetType'

export type FindPetsByTagsQueryParamsType = {
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

export const findPetsByTagsHeaderParamsXExample = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type FindPetsByTagsHeaderParamsXExampleType = (typeof findPetsByTagsHeaderParamsXExample)[keyof typeof findPetsByTagsHeaderParamsXExample]

export type FindPetsByTagsHeaderParamsType = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': FindPetsByTagsHeaderParamsXExampleType
}

/**
 * @description successful operation
 */
export type FindPetsByTags200Type = PetType[]

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400Type = any

/**
 * @description successful operation
 */
export type FindPetsByTagsQueryResponseType = PetType[]

export type FindPetsByTagsTypeQuery = {
  Response: FindPetsByTagsQueryResponseType
  QueryParams: FindPetsByTagsQueryParamsType
  HeaderParams: FindPetsByTagsHeaderParamsType
  Errors: FindPetsByTags400Type
}
