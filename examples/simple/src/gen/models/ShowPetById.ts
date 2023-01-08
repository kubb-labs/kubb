import type { Pet } from './Pet'

export type ShowPetByIdParams = {
  /**
   * @type string | undefined
   */
  petId?: string | undefined
  /**
   * @type string | undefined
   */
  testId?: string | undefined
}

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdResponse = Pet
