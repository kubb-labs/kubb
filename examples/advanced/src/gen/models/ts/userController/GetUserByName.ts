import type { User } from '../User'

/**
 * GetUserByName400
 * GetUserByName400
 * @description Invalid username supplied
 */
export type GetUserByName400 = any | null

/**
 * GetUserByName404
 * GetUserByName404
 * @description User not found
 */
export type GetUserByName404 = any | null

export type GetUserByNamePathParams = {
  /**
   * @description The name that needs to be fetched. Use user1 for testing.
   * @type string
   */
  username: string
}

/**
 * GetUserByNameQueryResponse
 * GetUserByNameQueryResponse
 * @description successful operation
 */
export type GetUserByNameQueryResponse = User
