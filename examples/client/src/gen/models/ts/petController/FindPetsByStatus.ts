import type { Pet } from '../Pet.js'

export const findPetsByStatusQueryParamsStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type FindPetsByStatusQueryParamsStatusEnum = (typeof findPetsByStatusQueryParamsStatusEnum)[keyof typeof findPetsByStatusQueryParamsStatusEnum]

export type FindPetsByStatusQueryParams = {
  /**
   * @description Status values that need to be considered for filter
   * @default "available"
   * @type string | undefined
   */
  status?: FindPetsByStatusQueryParamsStatusEnum
}

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any

/**
 * @description successful operation
 */
export type FindPetsByStatusQueryResponse = Pet[]

export type FindPetsByStatusQuery = {
  Response: FindPetsByStatusQueryResponse
  QueryParams: FindPetsByStatusQueryParams
  Errors: FindPetsByStatus400
}
