import type { PetType } from './PetType.ts'

export const findPetsByStatusQueryParamsStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type FindPetsByStatusQueryParamsStatusEnumType = (typeof findPetsByStatusQueryParamsStatusEnum)[keyof typeof findPetsByStatusQueryParamsStatusEnum]

export type FindPetsByStatusQueryParamsType = {
  /**
   * @description Status values that need to be considered for filter
   * @default "available"
   * @type string | undefined
   */
  status?: FindPetsByStatusQueryParamsStatusEnumType
}

/**
 * @description successful operation
 */
export type FindPetsByStatus200Type = PetType[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400Type = any

export type FindPetsByStatusQueryResponseType = FindPetsByStatus200Type

export type FindPetsByStatusTypeQuery = {
  Response: FindPetsByStatus200Type
  QueryParams: FindPetsByStatusQueryParamsType
  Errors: FindPetsByStatus400Type
}
