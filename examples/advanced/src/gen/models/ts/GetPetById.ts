import type { Pet } from './Pet'

export type GetPetByIdPathParams = {
  /**
   * @type integer int64
   */
  petId: number
}

export type GetPetByIdQueryParams = {}

/**
 * @description successful operation
 */
export type GetPetByIdResponse = Pet
