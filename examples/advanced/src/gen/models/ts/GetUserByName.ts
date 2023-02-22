import type { User } from './User'

export type GetUserByNamePathParams = {
  /**
   * @type string
   */
  username: string
}

export type GetUserByNameQueryParams = {}

/**
 * @description successful operation
 */
export type GetUserByNameResponse = User
