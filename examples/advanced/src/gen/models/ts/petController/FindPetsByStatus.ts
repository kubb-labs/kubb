import type { Pet } from '../Pet'

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any | null

export enum FindPetsByStatusQueryParamsStatus {
  'available' = 'available',
  'pending' = 'pending',
  'sold' = 'sold',
}
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
export type FindPetsByStatusQueryResponse = Pet[]
export namespace FindPetsByStatusQuery {
  export type Response = FindPetsByStatusQueryResponse
  export type QueryParams = FindPetsByStatusQueryParams
  export type Errors = FindPetsByStatus400
}
