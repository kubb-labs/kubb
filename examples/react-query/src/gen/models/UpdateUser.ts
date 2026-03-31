// version: 1.0.11
import type { User } from './User.ts'

/**
 * @type object
 */
export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 * @type any
 */
export type UpdateUserError = any

/**
 * @description Update an existent user in the store
 * @type object | undefined
 */
export type UpdateUserMutationRequest = User | undefined

export type UpdateUserMutationResponse = any

/**
 * @type object
 */
export type UpdateUserMutation = {
  Response: any
  Request: UpdateUserMutationRequest
  PathParams: UpdateUserPathParams
  Errors: UpdateUserError
}
