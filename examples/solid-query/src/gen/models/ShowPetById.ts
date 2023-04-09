import type { Error } from './Error'
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
 * @description unexpected error
 */
export type ShowPetByIdError = Error

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdResponse = Pet
