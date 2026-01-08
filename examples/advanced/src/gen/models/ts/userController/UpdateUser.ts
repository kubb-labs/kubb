import type { User } from '../User.ts'

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 */
export type UpdateUserStatusError = any

/**
 * @description Update an existent user in the store
 */
export type UpdateUserRequestData = Omit<NonNullable<User>, 'tag'>

export type UpdateUserResponseData = any
