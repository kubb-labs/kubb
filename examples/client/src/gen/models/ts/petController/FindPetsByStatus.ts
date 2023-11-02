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
}

/**
 * @description successful operation
 */
export type FindPetsByStatusQueryResponse = Pet[]

export namespace FindPetsByStatusQuery {
  export type Response = FindPetsByStatusQueryResponse
  export type QueryParams = FindPetsByStatusQueryParams
  export type Errors = FindPetsByStatus400
}
