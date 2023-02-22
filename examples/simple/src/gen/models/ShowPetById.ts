import type { Pet } from './Pet'

export type ShowPetByIdPathParams = {
  /**
   * @type string | undefined
   */
  petId?: string | undefined
  /**
   * @type string | undefined
   */
  testId?: string | undefined
}

export type ShowPetByIdQueryParams = {}

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdResponse = Pet
