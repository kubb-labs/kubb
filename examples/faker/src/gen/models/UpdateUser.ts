import type { User } from './User'

/**
 * @description successful operation
 */
export type UpdateUserError = any | null

export type UpdateUserMutationResponse = any | null

export type UpdateUserPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = User
