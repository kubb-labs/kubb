import type { Pet } from '../Pet.ts'

/**
 * @description successful operation
 * @type object
 */
export type AddFiles200 = Omit<NonNullable<Pet>, 'name'>

/**
 * @description Invalid input
 * @type any
 */
export type AddFiles405 = any

/**
 * @type object
 */
export type AddFilesMutationRequest = Omit<NonNullable<Pet>, 'id'>

export type AddFilesMutationResponse = AddFiles200

/**
 * @type object
 */
export type AddFilesMutation = {
  Response: AddFiles200
  Request: AddFilesMutationRequest
  Errors: AddFiles405
}
