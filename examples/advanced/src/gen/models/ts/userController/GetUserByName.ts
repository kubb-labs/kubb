import type { User } from '../User'

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
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 */
export type GetUserByNameResponse = User
