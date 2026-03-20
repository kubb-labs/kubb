import type { User } from '../User.ts'

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
export type GetUserByName200 = User

/**
 * @description Invalid username supplied
 */
export type GetUserByName400 = any

/**
 * @description User not found
 */
export type GetUserByName404 = any

export type GetUserByNameQuery = {
  Response: GetUserByName200
  Errors: GetUserByName400 | GetUserByName404
}

export type GetUserByNameQueryResponse = GetUserByName200
