import type { User } from './User'

export type UpdateUserPathParams = {
  /**
   * @type string
   */
  username: string
}

export type UpdateUserQueryParams = {}

export type UpdateUserResponse = any | null

/**
 * @description Update an existent user in the store
 */
export type UpdateUserRequest = User
