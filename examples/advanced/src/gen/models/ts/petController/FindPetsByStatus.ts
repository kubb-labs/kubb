import type { Pet } from '../Pet'

/**
 * FindPetsByStatus400
 * FindPetsByStatus400
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any | null

export const FindpetsbystatusqueryparamsStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type FindpetsbystatusqueryparamsStatus = (typeof FindpetsbystatusqueryparamsStatus)[keyof typeof FindpetsbystatusqueryparamsStatus]
export type FindpetsbystatusQueryparams = {
  /**
   * @description Status values that need to be considered for filter
   * @type string | undefined
   * @default 'available'
   */
  status?: FindpetsbystatusqueryparamsStatus
}

/**
 * FindPetsByStatusQueryResponse
 * FindPetsByStatusQueryResponse
 * @description successful operation
 */
export type FindPetsByStatusQueryResponse = Pet[]
