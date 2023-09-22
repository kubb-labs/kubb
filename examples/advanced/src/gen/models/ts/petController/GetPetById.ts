import type { Pet } from '../Pet'

/**
 * GetPetById400
 * GetPetById400
 * @description Invalid ID supplied
 */
export type GetPetById400 = any | null

/**
 * GetPetById404
 * GetPetById404
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
 * GetPetByIdQueryResponse
 * GetPetByIdQueryResponse
 * @description successful operation
 */
export type GetPetByIdQueryResponse = Pet
