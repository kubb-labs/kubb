import type { Pet } from './Pet'

/**
 * @description Invalid ID supplied
 */
export type GetPetById400 = any | null

/**
 * @description Pet not found
 */
export type GetPetById404 = any | null

export type GetPetByIdPathParams = {
  /**
   * @description ID of pet to return
   * @type integer int64
   */
  petId: number
}

/**
 * @description successful operation
 */
export type GetPetByIdQueryResponse = Pet
export namespace GetPetByIdQuery {
  export type Response = GetPetByIdQueryResponse
  export type PathParams = GetPetByIdPathParams
  export type Errors = GetPetById400 | GetPetById404
}
