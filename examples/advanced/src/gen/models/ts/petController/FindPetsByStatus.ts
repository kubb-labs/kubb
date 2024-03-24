import type { Pet } from '../Pet'

export enum FindPetsByStatusQueryParamsStatusEnum {
  'available' = 'available',
  'pending' = 'pending',
  'sold' = 'sold',
}
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
export type FindPetsByStatusQueryResponse = Pet[]

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any

export type FindPetsByStatusQuery = {
  Response: FindPetsByStatusQueryResponse
  QueryParams: FindPetsByStatusQueryParams
  Errors: FindPetsByStatus400
}
