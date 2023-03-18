import type { Pet } from './Pet'

export type ShowPetByIdPathParams = {
  /**
   * @type string
   */
  petId: string
  /**
   * @type string
   */
  testId: string
}

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdResponse = Pet
