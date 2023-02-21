import type { User } from './User'

export type GetUserByNameParams = {
  /**
   * @type string | undefined
   */
  username?: string | undefined
}

/**
 * @description successful operation
 */
export type GetUserByNameResponse = User
