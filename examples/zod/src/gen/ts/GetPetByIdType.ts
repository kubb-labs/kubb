import type { PetType } from './PetType'

export type GetPetByIdPathParamsType = {
  /**
   * @description ID of pet to return
   * @type integer, int64
   */
  petId: number
}
/**
 * @description successful operation
 */
export type GetPetById200Type = PetType
/**
 * @description Invalid ID supplied
 */
export type GetPetById400Type = any
/**
 * @description Pet not found
 */
export type GetPetById404Type = any
/**
 * @description successful operation
 */
export type GetPetByIdQueryResponseType = PetType
export type GetPetByIdTypeQuery = {
  Response: GetPetByIdQueryResponseType
  PathParams: GetPetByIdPathParamsType
  Errors: GetPetById400Type | GetPetById404Type
}
