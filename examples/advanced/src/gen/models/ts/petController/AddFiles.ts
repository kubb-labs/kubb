import type { Pet } from '../Pet.ts'

/**
 * @description successful operation
 */
export type AddFiles200 = Pet

/**
 * @description Invalid input
 */
export type AddFiles405 = any

export type AddFilesMutationRequest = Pet

export type AddFilesMutation = {
  Response: AddFiles200
  Request: AddFilesMutationRequest
  Errors: AddFiles405
}

export type AddFilesMutationResponse = AddFiles200
