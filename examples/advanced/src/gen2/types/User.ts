import type { TagTag } from './tag/Tag.ts'

export type User = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  username?: string
  /**
   * @deprecated
   * @type string | undefined, uuid
   */
  uuid?: string
  /**
   * @description The active tag
   * @type object | undefined
   */
  readonly tag?: TagTag
  /**
   * @type string | undefined
   */
  firstName?: string
  /**
   * @type string | undefined
   */
  lastName?: string
  /**
   * @type string | undefined, email
   */
  email?: string
  /**
   * @type string | undefined
   */
  password?: string
  /**
   * @type string | undefined
   */
  phone?: string
  /**
   * @description User Status
   * @type integer | undefined, int32
   */
  userStatus?: number
}
