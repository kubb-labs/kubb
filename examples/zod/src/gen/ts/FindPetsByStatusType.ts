import type { PetType } from './PetType'

export const findPetsByStatusQueryParamsStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type FindPetsByStatusQueryParamsStatusType = (typeof findPetsByStatusQueryParamsStatus)[keyof typeof findPetsByStatusQueryParamsStatus]

export type FindPetsByStatusQueryParamsType = {
  /**
   * @description Status values that need to be considered for filter
   * @default "available"
   * @type string | undefined
   */
  status?: FindPetsByStatusQueryParamsStatusType
}

/**
 * @description successful operation
 */
export type FindPetsByStatus200Type = PetType[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400Type = any

/**
 * @description successful operation
 */
export type FindPetsByStatusQueryResponseType = PetType[]

export type FindPetsByStatusTypeQuery = {
  Response: FindPetsByStatusQueryResponseType
  QueryParams: FindPetsByStatusQueryParamsType
  Errors: FindPetsByStatus400Type
}
