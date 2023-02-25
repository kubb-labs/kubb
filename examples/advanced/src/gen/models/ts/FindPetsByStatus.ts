import type { Pet } from './Pet'

export type FindPetsByStatusPathParams = {}

export const status = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type Status = (typeof status)[keyof typeof status]
export type FindPetsByStatusQueryParams = {
  /**
   * @type string | undefined
   */
  status?: Status | undefined
}

/**
 * @description successful operation
 */
export type FindPetsByStatusResponse = Pet[]
