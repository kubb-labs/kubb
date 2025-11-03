import type { Pet } from '../Pet.ts'

/**
 * @description successful operation
 */
export type AddFiles200 = Omit<NonNullable<Pet>, 'name'>

/**
 * @description Invalid input
 */
export type AddFiles405 = any

export type AddFilesMutationRequest = Omit<NonNullable<Pet>, 'id'>

export type AddFilesMutationResponse = AddFiles200

export type AddFilesMutation = {
  Response: AddFiles200
  Request: AddFilesMutationRequest
  Errors: AddFiles405
}
