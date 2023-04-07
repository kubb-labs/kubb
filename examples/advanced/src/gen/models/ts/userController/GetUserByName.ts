import type { User } from '../User'

export type GetUserByNamePathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Invalid username supplied
 */
export type GetUserByName400 = any | null

/**
 * @description User not found
 */
export type GetUserByName404 = any | null

/**
 * @description successful operation
 */
export type GetUserByNameResponse = User
