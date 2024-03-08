import type { User } from '../../models'

/**
 * @description successful operation
 */
export type UpdateUserError = any

export type UpdateUserMutationResponse = any

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = User
export type UpdateUserMutation = {
  Response: UpdateUserMutationResponse
  Request: UpdateUserMutationRequest
  PathParams: UpdateUserPathParams
}
