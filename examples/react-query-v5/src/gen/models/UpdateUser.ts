import type { User } from './User'

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

export type UpdateUserMutationResponse = any

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = User

/**
 * @description successful operation
 */
export type UpdateUserError = any

export type UpdateUserMutation = {
  Response: UpdateUserMutationResponse
  Request: UpdateUserMutationRequest
  PathParams: UpdateUserPathParams
}
