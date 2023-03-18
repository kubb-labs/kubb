import type { Pet } from './Pet'

export const findPetsByStatusQueryParamsStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type FindPetsByStatusQueryParamsStatus = (typeof findPetsByStatusQueryParamsStatus)[keyof typeof findPetsByStatusQueryParamsStatus]
export type FindPetsByStatusQueryParams = {
  /**
   * @type string | undefined
   */
  status?: FindPetsByStatusQueryParamsStatus | undefined
}

/**
 * @description successful operation
 */
export type FindPetsByStatusResponse = Pet[]
