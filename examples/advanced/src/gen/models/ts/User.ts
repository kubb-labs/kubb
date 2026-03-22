import type { TagTag } from './tag/Tag.ts'

export type User = {
  id?: number
  username?: string
  /**
   * @deprecated
   */
  uuid?: string
  /**
   * @description The active tag
   */
  readonly tag?: TagTag
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  /**
   * @description User Status
   */
  userStatus?: number
}
