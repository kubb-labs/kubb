import type { Pet } from '../../models/ts/Pet'

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
