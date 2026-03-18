import type { Pet } from '../Pet.ts'

/**
 * @default available
 */
export type FindPetsByStatusStatus = 'available' | 'pending' | 'sold'

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

export interface FindPetsByStatusData {
  data?: never
  pathParams?: never
  queryParams?: {
    status?: FindPetsByStatusStatus
  }
  headerParams?: never
  url: '/pet/findByStatus'
}

export interface FindPetsByStatusResponses {
  '200': FindPetsByStatus200
}

export type FindPetsByStatusResponse = FindPetsByStatus200
