import type { TagTag } from './tag/Tag.ts'

/**
 * @type object
 */
export type User = {
  /**
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @example theUser
   * @type string | undefined
   */
  username?: string
  /**
   * @deprecated
   * @type string | undefined
   */
  uuid?: string
  /**
   * @description The active tag
   * @deprecated
   * @type object | undefined
   */
  readonly tag?: TagTag
  /**
   * @example John
   * @type string | undefined
   */
  firstName?: string
  /**
   * @example James
   * @type string | undefined
   */
  lastName?: string
  /**
   * @example john@email.com
   * @type string | undefined
   */
  email?: string
  /**
   * @example 12345
   * @type string | undefined
   */
  password?: string
  /**
   * @example 12345
   * @type string | undefined
   */
  phone?: string
  /**
   * @description User Status
   * @example 1
   * @type integer | undefined
   */
  userStatus?: number
}
