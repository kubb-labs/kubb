import type { Pet } from '../Pet'

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any | null

export const FindPetsByStatusQueryParamsStatus = {
  'available': 'available',
  'pending': 'pending',
  'sold': 'sold',
} as const
export type FindPetsByStatusQueryParamsStatus = (typeof FindPetsByStatusQueryParamsStatus)[keyof typeof FindPetsByStatusQueryParamsStatus]
export type FindPetsByStatusQueryParams = {
  /**
   * @description Status values that need to be considered for filter
   * @type string | undefined
   * @default 'available'
   */
  status?: FindPetsByStatusQueryParamsStatus
} | undefined

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

/**
 * @description successful operation
 */
export type FindPetsByStatusQueryResponse = Pet[]
export type FindPetsByStatusQuery = {
  Response: FindPetsByStatusQueryResponse
  QueryParams: FindPetsByStatusQueryParams
  Errors: FindPetsByStatus400
}
