import type { Pet } from './Pet'

export type GetPetByIdPathParams = {
  /**
   * @description ID of pet to return
   * @type integer, int64
   */
  petId: number
}
/**
 * @description successful operation
 */
export type GetPetById200 = Pet
/**
 * @description Invalid ID supplied
 */
export type GetPetById400 = any
/**
 * @description Pet not found
 */
export type GetPetById404 = any
/**
 * @description successful operation
 */
export type GetPetByIdQueryResponse = Pet
export type GetPetByIdQuery = {
  Response: GetPetByIdQueryResponse
  PathParams: GetPetByIdPathParams
  Errors: GetPetById400 | GetPetById404
}
