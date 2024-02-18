import type { User } from '../../models'

export type UpdateUserMutationResponse = any | null

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
