import type { User } from '../User'

export type GetUserByNamePathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 */
export type GetUserByNameResponse = User
