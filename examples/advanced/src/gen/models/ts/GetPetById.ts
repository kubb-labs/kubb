import type { Pet } from './Pet'

export type GetPetByIdPathParams = {
  /**
   * @type integer | undefined int64
   */
  petId?: number | undefined
}

export type GetPetByIdQueryParams = {}

/**
 * @description successful operation
 */
export type GetPetByIdResponse = Pet
