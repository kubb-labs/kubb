import type { Pet } from '../Pet'

export type GetPetByIdPathParams = {
  /**
   * @type integer int64
   */
  petId: number
}

/**
 * @description successful operation
 */
export type GetPetByIdResponse = Pet
