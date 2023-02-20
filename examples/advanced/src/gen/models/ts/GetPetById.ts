import type { Pet } from './Pet'

export type GetPetByIdParams = {
  /**
   * @type integer | undefined int64
   */
  petId?: number | undefined
}

/**
 * @description successful operation
 */
export type GetPetByIdResponse = Pet
