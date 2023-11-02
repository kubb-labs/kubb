import type { User } from './User'

/**
 * @description Invalid username supplied
 */
export type GetUserByName400 = any | null

/**
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
 * @description successful operation
 */
export type GetUserByNameQueryResponse = User

export type GetUserByName = {
  response: GetUserByNameQueryResponse
  pathParams: GetUserByNamePathParams
  errors: GetUserByName400 | GetUserByName404
}
