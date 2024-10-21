import type { PetType } from './PetType.ts'

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

export const findPetsByTagsHeaderParamsXExampleEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type FindPetsByTagsHeaderParamsXExampleEnumType = (typeof findPetsByTagsHeaderParamsXExampleEnum)[keyof typeof findPetsByTagsHeaderParamsXExampleEnum]

export type FindPetsByTagsHeaderParamsType = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': FindPetsByTagsHeaderParamsXExampleEnumType
}

/**
 * @description successful operation
 */
export type FindPetsByTags200Type = PetType[]

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400Type = any

export type FindPetsByTagsQueryResponseType = FindPetsByTags200Type

export type FindPetsByTagsTypeQuery = {
  Response: FindPetsByTags200Type
  QueryParams: FindPetsByTagsQueryParamsType
  HeaderParams: FindPetsByTagsHeaderParamsType
  Errors: FindPetsByTags400Type
}
