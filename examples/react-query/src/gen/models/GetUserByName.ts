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
export namespace GetUserByNameQuery {
  export type Response = GetUserByNameQueryResponse
  export type PathParams = GetUserByNamePathParams
  export type Errors = GetUserByName400 | GetUserByName404
}
