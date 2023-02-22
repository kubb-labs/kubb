import type { User } from './User'

export type UpdateUserPathParams = {
  /**
   * @type string | undefined
   */
  username?: string | undefined
}

export type UpdateUserQueryParams = {}

/**
 * @description Update an existent user in the store
 */
export type UpdateUserRequest = User

export type UpdateUserResponse = any | null
