import type { Pet } from './Pet.ts'

export type FindPetsByStatusPathParams = {
  /**
   * @type string
   */
  step_id: string
}

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any

export type FindPetsByStatusQueryResponse = FindPetsByStatus200

export type FindPetsByStatusQuery = {
  Response: FindPetsByStatus200
  PathParams: FindPetsByStatusPathParams
  Errors: FindPetsByStatus400
}
