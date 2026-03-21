import type { Pet } from '../Pet.ts'

export type FindPetsByStatusPathParams = {
  /**
   * @type string
   */
  stepId: string
}

/**
 * @description successful operation
 * @minLength 1
 * @maxLength 3
 */
export type FindPetsByStatus200 = Array<Pet>

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any

export type FindPetsByStatusQuery = {
  Response: FindPetsByStatus200
  PathParams: FindPetsByStatusPathParams
  Errors: FindPetsByStatus400
}

export type FindPetsByStatusQueryResponse = FindPetsByStatus200
