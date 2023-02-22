import type { User } from './User'

export type GetUserByNamePathParams = {
  /**
   * @type string | undefined
   */
  username?: string | undefined
}

export type GetUserByNameQueryParams = {}

/**
 * @description successful operation
 */
export type GetUserByNameResponse = User
