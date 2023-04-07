import type { Pet } from './Pet'
import type { Error } from './Error'

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

/**
 * @description unexpected error
 */
export type ShowPetByIdError = Error
