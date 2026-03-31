import type { Pet } from '../Pet.ts'

/**
 * @type object
 */
export type FindPetsByStatusPathParams = {
  /**
   * @type string
   */
  stepId: string
}

/**
 * @description successful operation
 * @type array
 */
export type FindPetsByStatus200 = Array<Pet>

/**
 * @description Invalid status value
 * @type any
 */
export type FindPetsByStatus400 = any

export type FindPetsByStatusQueryResponse = FindPetsByStatus200

/**
 * @type object
 */
export type FindPetsByStatusQuery = {
  Response: FindPetsByStatus200
  PathParams: FindPetsByStatusPathParams
  Errors: FindPetsByStatus400
}
