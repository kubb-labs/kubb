import type { Pet } from '../Pet'

export type GetPetByIdPathParams = {
  /**
   * @type integer int64
   */
  petId: number
}

/**
 * @description Invalid ID supplied
 */
export type GetPetById400 = any | null

/**
 * @description Pet not found
 */
export type GetPetById404 = any | null

/**
 * @description successful operation
 */
export type GetPetByIdResponse = Pet
